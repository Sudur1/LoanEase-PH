# LoanEase PH — Docker + Kubernetes Setup Guide

Follow this guide step-by-step. Everything you need to **copy/paste** is in this document.
**No commands will be auto-run** — you run them yourself in your terminal.

---

## 📋 Prerequisites

Make sure you have these installed:

1. **Docker Desktop** — https://www.docker.com/products/docker-desktop/
2. **Kubernetes** — Enable in Docker Desktop Settings → Kubernetes → "Enable Kubernetes" → Apply & Restart
3. **VS Code** — https://code.visualstudio.com/

Verify everything works:
```bash
docker --version
kubectl version --client
```

---

## 📁 Final Project Structure

After all the changes, your folder should look like this:

```
Victor_App/
├── Dockerfile                       # Docker build instructions
├── .dockerignore                    # Files to exclude from image
├── server.js                        # Entry point (waits for DB + auto-initializes)
├── package.json
├── .env                             # (used only when running locally)
├── config/
│   ├── db.js                        # MySQL pool + retry logic
│   └── initDatabase.js              # Auto-creates tables + seeds data
├── routes/
│   ├── auth.js                      # Signup / Login
│   ├── items.js                     # Product catalog
│   └── loans.js                     # Loans with multiple items
├── js/                              # ← NEW: external JavaScript files
│   ├── items.js
│   ├── signup.js
│   └── login.js
├── css/
│   ├── shared.css, index.css, ...
├── index.html, items.html, login.html, signup.html, ...
└── kubernetes/                      # ← NEW: all 8 Kubernetes YAML files
    ├── db-credentials.yaml
    ├── db-config.yaml
    ├── db-pv.yaml
    ├── db-pvc.yaml
    ├── mysql-deployment.yaml
    ├── mysql-service.yaml
    ├── app-deployment.yaml
    └── lb-service.yaml
```

---

## 🚀 STEP-BY-STEP DEPLOYMENT

### **STEP 1: Open the project in VS Code**

Open your terminal in VS Code (View → Terminal) and navigate to the project:
```bash
cd "/Users/juangabrielvictor/Desktop/AppDev_Lab/Victor_App"
```

---

### **STEP 2: Pull MySQL image from Docker**

```bash
docker pull mysql:8.0
```

Wait for it to finish.

---

### **STEP 3: Build your application image**

> Replace `victor` with your surname if you want (PDF says to use surname).

```bash
docker build -t loanease-app-victor:v2 .
```

Wait for the build to finish (it will install npm packages and copy files).

Verify the image exists:
```bash
docker images | grep loanease-app
```

---

### **STEP 4: Verify all Kubernetes YAML files exist**

Run this to make sure all 8 files are there:
```bash
ls kubernetes/
```

You should see:
```
app-deployment.yaml   db-config.yaml        db-pv.yaml            lb-service.yaml
db-credentials.yaml   db-pvc.yaml           mysql-deployment.yaml mysql-service.yaml
```

---

### **STEP 5: Apply the Kubernetes YAML files in order**

Run each `kubectl apply -f` command **one at a time** in the terminal:

```bash
kubectl apply -f kubernetes/db-credentials.yaml
```
```bash
kubectl apply -f kubernetes/db-config.yaml
```
```bash
kubectl apply -f kubernetes/db-pv.yaml
```
```bash
kubectl apply -f kubernetes/db-pvc.yaml
```
```bash
kubectl apply -f kubernetes/mysql-deployment.yaml
```
```bash
kubectl apply -f kubernetes/mysql-service.yaml
```
```bash
kubectl apply -f kubernetes/app-deployment.yaml
```
```bash
kubectl apply -f kubernetes/lb-service.yaml
```

> 💡 **Shortcut**: You can also apply the entire folder at once:
> ```bash
> kubectl apply -f kubernetes/
> ```

---

### **STEP 6: Verify pods are running**

```bash
kubectl get pods
```

You should see something like:
```
NAME                            READY   STATUS    RESTARTS   AGE
loanease-app-xxxxxxxxxx-xxxxx   1/1     Running   0          30s
mysql-xxxxxxxxxx-xxxxx          1/1     Running   0          30s
```

**Both should be `Running` and `1/1` READY.**

⏳ If status shows `ContainerCreating` or `Pending`, wait 30 seconds and run again.

If the app pod shows `CrashLoopBackOff`, view the logs to debug:
```bash
kubectl logs deployment/loanease-app
```

---

### **STEP 7: Verify the services**

```bash
kubectl get services
```

You should see:
```
NAME                   TYPE           CLUSTER-IP      EXTERNAL-IP   PORT(S)
kubernetes             ClusterIP      10.96.0.1       <none>        443/TCP
loanease-app-service   LoadBalancer   10.x.x.x        localhost     80:xxxxx/TCP
mysql-service          ClusterIP      10.x.x.x        <none>        3306/TCP
```

---

### **STEP 8: Open the app in your browser**

Open this URL:

```
http://localhost
```

You should see your LoanEase PH homepage! 🎉

Try:
- **http://localhost/items.html** — should load 24 items from the database
- **http://localhost/signup.html** — create an account
- **http://localhost/login.html** — log in

---

### **STEP 9: Test data persistence (the whole point of this lab)**

This proves the **PersistentVolume** is working.

**A. Create an account** at `http://localhost/signup.html`

**B. Delete the app pod** to simulate a crash:

First get the pod name:
```bash
kubectl get pods
```

Copy the name of the `loanease-app-...` pod, then:
```bash
kubectl delete pod <paste-loanease-app-pod-name-here>
```

**C. Wait ~10 seconds**, then check pods again:
```bash
kubectl get pods
```

Kubernetes auto-creates a new app pod. ✅

**D. Refresh `http://localhost/login.html`** and log in with the account you made.

✅ **Account still works!** The database survived because MySQL data is stored on a **PersistentVolume** (`/mnt/data` on the host).

---

## 🧹 USEFUL COMMANDS

### Check pod logs (great for debugging)
```bash
kubectl logs deployment/loanease-app
kubectl logs deployment/mysql
```

### Get into a running pod's shell
```bash
kubectl exec -it deployment/mysql -- mysql -u root -p
# Then enter password: root
# Then: SHOW DATABASES; USE loanease_ph; SHOW TABLES; SELECT * FROM users;
```

### Restart the app deployment (without deleting data)
```bash
kubectl rollout restart deployment/loanease-app
```

### Tear everything down
```bash
kubectl delete -f kubernetes/
```

### Tear down but keep persistent data
```bash
kubectl delete -f kubernetes/lb-service.yaml
kubectl delete -f kubernetes/app-deployment.yaml
kubectl delete -f kubernetes/mysql-service.yaml
kubectl delete -f kubernetes/mysql-deployment.yaml
# (do NOT delete db-pv.yaml or db-pvc.yaml — keeps the data)
```

### Rebuild after code changes
```bash
docker build -t loanease-app-victor:v2 .
kubectl rollout restart deployment/loanease-app
```

---

## 🐛 TROUBLESHOOTING

### Problem: `localhost` doesn't load
- Wait 30 seconds after `kubectl apply` for everything to come up
- Check: `kubectl get pods` — both pods must be `Running`
- Check: `kubectl get services` — `loanease-app-service` must have `EXTERNAL-IP: localhost`

### Problem: `kubectl get pods` shows `ImagePullBackOff`
- Means Kubernetes can't find your image. Make sure the build succeeded:
  ```bash
  docker images | grep loanease
  ```
- The image name in `kubernetes/app-deployment.yaml` MUST match exactly what you built (`loanease-app-victor:v2`)

### Problem: App pod shows `CrashLoopBackOff`
- Check the logs:
  ```bash
  kubectl logs deployment/loanease-app
  ```
- Most likely cause: MySQL not ready yet — wait 30 seconds, then:
  ```bash
  kubectl rollout restart deployment/loanease-app
  ```

### Problem: Items page is empty
- Open browser DevTools (F12) → Console — check for fetch errors
- Check app logs: `kubectl logs deployment/loanease-app`
- The seed runs automatically; check it printed `✅ Seeded 24 items`
- Verify in MySQL:
  ```bash
  kubectl exec -it deployment/mysql -- mysql -u root -proot -e "USE loanease_ph; SELECT COUNT(*) FROM items;"
  ```

### Problem: Port 80 in use
- Some other program is using port 80. Edit `kubernetes/lb-service.yaml`:
  ```yaml
  ports:
    - port: 8080      # ← change from 80 to 8080
      targetPort: 3000
  ```
- Then access via `http://localhost:8080`

---

## 📸 SCREENSHOTS FOR YOUR PDF SUBMISSION

For the lab submission, take screenshots of:

1. `docker build -t loanease-app-victor:v2 .` output
2. `docker pull mysql:8.0` output
3. Each `kubectl apply -f ...` command output
4. `kubectl get pods` — both pods Running
5. `kubectl get services` — service list
6. Browser at `http://localhost` showing the homepage
7. Browser at `http://localhost/items.html` showing items
8. Adding a record (signup form filled in, then success message)
9. `kubectl delete pod <pod-name>` output
10. `kubectl get pods` after delete (showing new pod auto-created)
11. Browser refresh showing the record still exists ✅ (proves persistence)

---

## 💡 OBSERVATIONS TO WRITE IN YOUR PDF

Sample observations you can include:

> **Persistent Volume Behavior:**
> When the `loanease-app` pod was deleted, Kubernetes automatically created a new pod from the deployment specification. Despite the pod being completely destroyed, all user accounts and database records remained accessible after the new pod started. This is because the MySQL database stores its data files in `/var/lib/mysql`, which is mounted to the `PersistentVolume` at `/mnt/data` on the host. The volume's lifecycle is independent of any pod, so data survives pod restarts, crashes, and even MySQL deployment updates.

> **Auto-recovery:**
> The deployment's ReplicaSet controller detected the missing pod and immediately scheduled a new one. The new pod connected to the same MySQL service (still running independently) via the cluster's internal DNS (`mysql-service`), and my web app reloaded all 24 items + my signed-up user account from the persisted database.

> **Separation of concerns:**
> The `Secret` object (`db-credentials`) safely stored the MySQL root password as base64-encoded data instead of plaintext, and the `ConfigMap` (`db-config`) decoupled the database hostname from the application code — both injected as environment variables into the app container.

---

## ✅ CHECKLIST

Before submitting, verify:

- [ ] All files in the project structure exist
- [ ] `docker build` completed successfully
- [ ] All 8 `kubectl apply` commands ran without errors
- [ ] `kubectl get pods` shows both pods `Running` `1/1`
- [ ] `http://localhost` opens the homepage
- [ ] `http://localhost/items.html` shows 24 items
- [ ] Can create an account at `/signup.html`
- [ ] Can log in at `/login.html`
- [ ] Deleted app pod → new one spawned → data still there ✅

---

## 🎉 YOU'RE DONE!

Your LoanEase PH application is now running in Kubernetes with:
- ✅ Persistent MySQL database (data survives pod restarts)
- ✅ Secret-based credential management
- ✅ ConfigMap-based configuration
- ✅ LoadBalancer service exposing port 80
- ✅ Auto-healing deployments (Kubernetes recreates failed pods)
- ✅ Separated JS/CSS/HTML for maintainability
