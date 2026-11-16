#!/bin/bash
# Corte automático de facturación para Carta Online (tope USD 10, aviso al 50%)
set -e
PROJECT=studio-4948282065-ea24d
BA=01DB2B-F4B87F-90092B
REGION=us-central1
TOPIC=tope-facturacion
SA=corte-facturacion
gcloud config set project $PROJECT -q
echo ">> Activando APIs"
gcloud services enable cloudbilling.googleapis.com billingbudgets.googleapis.com pubsub.googleapis.com cloudfunctions.googleapis.com run.googleapis.com cloudbuild.googleapis.com eventarc.googleapis.com artifactregistry.googleapis.com -q
echo ">> Topic"
gcloud pubsub topics describe $TOPIC >/dev/null 2>&1 || gcloud pubsub topics create $TOPIC -q
gcloud pubsub topics add-iam-policy-binding $TOPIC --member=serviceAccount:billing-budget-alert@system.gserviceaccount.com --role=roles/pubsub.publisher -q >/dev/null
echo ">> Cuenta de servicio"
gcloud iam service-accounts describe $SA@$PROJECT.iam.gserviceaccount.com >/dev/null 2>&1 || gcloud iam service-accounts create $SA --display-name="Corte de facturacion Carta Online" -q
sleep 10
gcloud projects add-iam-policy-binding $PROJECT --member=serviceAccount:$SA@$PROJECT.iam.gserviceaccount.com --role=roles/billing.projectManager --condition=None -q >/dev/null
echo ">> Codigo de la funcion"
mkdir -p ~/corte && cd ~/corte
cat > main.py <<'PY'
import base64, json, os
import functions_framework
from googleapiclient import discovery

PROJECT_ID = os.environ["PROJECT_ID"]
SIMULATE = os.environ.get("SIMULATE", "false") == "true"

@functions_framework.cloud_event
def cortar_facturacion(cloud_event):
    data = json.loads(base64.b64decode(cloud_event.data["message"]["data"]).decode("utf-8"))
    cost = float(data.get("costAmount", 0))
    budget = float(data.get("budgetAmount", 0))
    print(f"Gasto {cost} / tope {budget} (simulacion={SIMULATE})")
    if budget <= 0 or cost < budget:
        print("Debajo del tope: no se hace nada")
        return
    billing = discovery.build("cloudbilling", "v1", cache_discovery=False)
    name = f"projects/{PROJECT_ID}"
    info = billing.projects().getBillingInfo(name=name).execute()
    if not info.get("billingEnabled"):
        print("La facturacion ya estaba desactivada")
        return
    if SIMULATE:
        print("SIMULACION: aca se desactivaria la facturacion de " + PROJECT_ID)
        return
    billing.projects().updateBillingInfo(name=name, body={"billingAccountName": ""}).execute()
    print("FACTURACION DESACTIVADA en " + PROJECT_ID)
PY
printf 'functions-framework==3.*\ngoogle-api-python-client==2.*\n' > requirements.txt
echo ">> Desplegando funcion (modo simulacion)"
gcloud functions deploy corte-facturacion --gen2 --region=$REGION --runtime=python312 --source=. --entry-point=cortar_facturacion --trigger-topic=$TOPIC --service-account=$SA@$PROJECT.iam.gserviceaccount.com --set-env-vars=PROJECT_ID=$PROJECT,SIMULATE=true --max-instances=1 -q
echo ">> Presupuesto"
if ! gcloud billing budgets list --billing-account=$BA --format='value(displayName)' | grep -q "Carta Online - tope USD 10"; then
gcloud billing budgets create --billing-account=$BA --display-name="Carta Online - tope USD 10" --budget-amount=10USD --filter-projects=projects/$PROJECT --threshold-rule=percent=0.5 --threshold-rule=percent=0.9 --threshold-rule=percent=1.0 --notifications-rule-pubsub-topic=projects/$PROJECT/topics/$TOPIC -q
fi
echo "=== SETUP OK ==="
