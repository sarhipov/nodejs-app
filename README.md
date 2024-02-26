# Intro 



## Project structure
Project includes following: 
 - nodejs app (forked from https://github.com/cristiklein/node-hostname). NOTE: added timestamp and health endpoint
 - Dockerfile to build container 
 - Jenkinsfile(s) to create a CI/CD pipeline. NOTE: there are two variants of pipeline to deploy with `kubectl` and `helm`
 - k8s 
    * jenkins - parametrised manifest used in `Jenkinsfile_kubectl` pipeline
    * helm - helm chart to deploy app
    * yaml - individual yaml files to deploy app

**NOTE!!!** Infrastructure provisioning/creation with IaC is out of scope. Below in following section there is high-level description of used/needed infrastructure

### Project tree: 
```
.
├── Dockerfile                    --> Docker file 
├── Jenkinsfile_helm              --> Jenkins pipeline to Build/Push and deploy with helm
├── Jenkinsfile_kubectl           --> Jenkins pipeline to Build/Push and deploy with kubectl
├── README.md
├── app.js
├── bin
│   └── www
├── k8s                           --> k8s related files
│   ├── helm                      --> helm chart
│   │   ├── Chart.yaml
│   │   ├── templates
│   │   │   ├── deployment.yaml
│   │   │   ├── ingress.yaml
│   │   │   ├── namespace.yaml
│   │   │   └── service.yaml
│   │   ├── values.yaml
│   │   └── values_jenkins.yaml
│   ├── jenkins
│   │   └── parametrised.yaml
│   └── yaml                      --> individual yamls to deploy app with kubectl 
│       ├── all.yaml
│       ├── deployment.yaml
│       ├── ingress_alb.yaml
│       ├── ingress_nginx.yaml
│       ├── namespace.yaml
│       └── svc.yaml
├── package-lock.json
├── package.json
└── routes
    ├── crash.js
    ├── health.js
    ├── index.js
    └── users.js

```


## Infrastructure 
<img src="https://github.com/sarhipov/nodejs-app/blob/main/bwt_task.png?raw=true" alt="High-Level Project" width="1000" height="950">

### K8s custer
- AWS managed k8s cluster(EKS cluster)  
- worker node with tain and affinity (application:nodejs-app)
- aws-load-balancer-controller(ALB controller) to provision AWS resources required to expose Ingress type of service

### LoadBalancer
- AWS managed Application Load Balancer(ALB)
- ALB has wildcard certificate (*.). TLS termination happens on ALB.

### Jenkins as CI/CD 
Jenkins used as CI/CD platform. 

List of required Jenkins plugins:  
   - kubernetes
   - SSH: (SSH agent, SSH Credential Plugin, SSH server, SSH Build Agents) 
   - Credentials 
   - Docker (Docker Commons, Docker Pipeline)
   - workflow-aggregator
   - Git (Git client plugin, Git Parameter, Git plugin, GitHub, GitHub API,  )
   - configuration-as-code
   - helm

### Other services
 - AWS Certificate Manager to store certificate used in AWS ALB 
 - AWS Secrets Manager  to store secrets 
 - AWS Route53 as DNS service 
 - GitHub to host project code 
 - DockerHub to host docker image 
  
## Manual Build, Deploy and Test process  
### Manual build 

**Step1:** Clone repo
```
git clone git@github.com:sarhipov/nodejs-app.git
```

**Step 2:** Login to dockerhub (to push Docker image)
**Step 3:** Build and tag
```
# build & tag
docker build -f Dockerfile -t sarhipov/nodejs-app:latest .

# push image (to dockerhub)
docker push sarhipov/nodejs-app:latest
```

### Run and test 
**Step 1:** run application locally 

```
# run locally and remove when stopped
docker run -it -d -p 8080:3000 --rm sarhipov/nodejs-app:latest
```

**Step 2:**  Verify that application works as expected
```
curl http://localhost:8080

# expected output 
{"hostname":"be1d359d43f3","timestampLocal":"24-02-2024 10:35:15"}
```
```
curl http://localhost:8080/health

# expected output 
OK
```

### Manual Deploy 


**Step 1** Preparation 

(optional) Add new worker node


(optional) Add ddd taint and label, so that application will be hosted on that node
```
# get existing taints and node labels
kubectl get nodes -o custom-columns=NAME:.metadata.name,TAINTS:.spec.taints
kubectl get nodes --show-labels 

# add taint and label 
node_name="ip-10-200-21-48.us-west-2.compute.internal"
key="application"
value="nodejs-app"

kubectl label nodes $node_name $key=$value
kubectl taint nodes $node_name $key=$value:NoSchedule
```

#### Kubectl
```
# Deploy resources 
kubectl create -f <manifest_file>

# Destroy resources 
kubectl delete -f <manifest_file>
```

#### Helm
```
# Deploy resources 
helm install nodejs-app . -f values.yaml

# Destroy resources 
helm uninstall nodejs-app . -f values.yaml
```

### CI/CD pipeline
Jenkins uses as the CI/CD tool. To deploy an application simple pipeline is used. Pipeline consist of multiple stages 

1) `Checkout`'
description: 'Checkout application code from the Git repository'

2) `Build Docker Image`
description: 'Build docker image and push it to the Docker repository'
 
3) `Deploy to Kubernetes`
description: 'Deploy application to the Kubernetes cluster using kubectl or helm'


## TODO
This if just FYI. Some improvement ideas. Just didn't have enough time to implement everything as I wanted
- Terraform code to deploy infrastructure in dev environment(minikube, nginx proxy)
- put Jenkins credentials/secrets into Secrets manager or/and kubernetes secrets
-  Create dockerized agent to do k8s deployment. Use different agents for different stages (build and deploy )
- ...





