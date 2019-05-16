# Cloud Build container for ProjectVisBug

## To create
* Create a CGP Project for running Cloud Build
* Set environment variable
* `export PROJECT_ID=[Project ID]`
* Run `make`

## To use
* `cd ..`
* `gcloud builds submit --config cloudbuild.yaml .`
