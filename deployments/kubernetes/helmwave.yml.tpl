version: 0.36.3
project: StorageBrowser

{{- $ingressClass := env "INGRESS_CLASS" }}

repositories:
  - name: stakater
    url: https://stakater.github.io/stakater-charts
{{- if eq $ingressClass "kong" }}
  - name: bedag
    url: https://bedag.github.io/helm-charts
{{- end }}

releases:
{{- if eq $ingressClass "kong" }}
  - name: storage-browser-kong
    namespace: storage-browser
    description: Kong configurations for ParminCloud S3 Object Storage Browser
    max_history: 3
    allow_failure: false
    create_namespace: true
    reuse_values: false
    wait: true
    wait_for_jobs: true
    chart:
      name: bedag/raw
    values:
      - src: values.kong.yaml
        strict: true
{{- end }}

  - name: storage-browser
    namespace: storage-browser
    description: ParminCloud S3 Object Storage Browser
    max_history: 3
    allow_failure: false
    create_namespace: true
    reuse_values: false
    wait: true
    wait_for_jobs: true
    chart:
      name: stakater/application
    values:
      - src: ./values.yaml
        strict: true
        renderer: sprig
{{- if eq $ingressClass "kong" }}
    depends_on:
      - name: storage-browser-kong
        optional: false
{{- end }}
