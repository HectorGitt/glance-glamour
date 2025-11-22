# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/727caa6e-1be8-411f-af53-10c8e07a6285

## How can I edit this code?

There are se- **`cloudbuild.yaml`**: Google Cloud Build configuration with timestamp-based image taggingeral ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/727caa6e-1be8-411f-af53-10c8e07a6285) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

-   Navigate to the desired file(s).
-   Click the "Edit" button (pencil icon) at the top right of the file view.
-   Make your changes and commit the changes.

**Use GitHub Codespaces**

-   Navigate to the main page of your repository.
-   Click on the "Code" button (green button) near the top right.
-   Select the "Codespaces" tab.
-   Click on "New codespace" to launch a new Codespace environment.
-   Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

-   Vite
-   TypeScript
-   React
-   shadcn-ui
-   Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/727caa6e-1be8-411f-af53-10c8e07a6285) and click on Share -> Publish.

## Docker Deployment

This project includes Docker support for containerized deployment.

### Building and Running with Docker

```sh
# Option 1: Using Docker directly
docker build -t avera .
docker run -p 4200:4200 avera

# Option 2: Using Docker Compose (recommended)
docker-compose up --build
```

The application will be available at `http://localhost:4200`.

### Docker Configuration

-   **Dockerfile**: Multi-stage build that creates a production-ready image
-   **Base Image**: Node.js 18 with build-essential and Python for native dependencies
-   **Build Process**: Optimized with layer caching and proper dependency installation
-   **Output Directory**: Vite builds to `dist` directory
-   **Port**: Application runs on port 4200 inside the container
-   **Static Serving**: Uses `serve` package for production hosting

## Google Cloud Deployment

This project includes Google Cloud deployment configuration for automated CI/CD.

### Prerequisites

1. Install [Google Cloud CLI](https://cloud.google.com/sdk/docs/install)
2. Authenticate: `gcloud auth login`
3. Set your project: `gcloud config set project YOUR_PROJECT_ID`
4. Copy `.env.deploy.example` to `.env.deploy` and update the values
5. Set the required environment variables (see Environment Variables section below)

### Required IAM Permissions

Your Google Cloud account or service account needs these roles:

-   `Cloud Run Admin`
-   `Cloud Build Editor`
-   `Storage Admin` (for Container Registry)
-   `Service Account User`

Create a service account for CI/CD:

```sh
gcloud iam service-accounts create avera-deployer
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:avera-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:avera-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.editor"
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:avera-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.admin"
```

### Automated Deployment

#### Option 1: Using the deployment script (Recommended)

**Linux/macOS:**

```sh
# Set your environment variables
export PROJECT_ID="your-project-id"
export VITE_API_BASE_URL="https://your-backend-api-url"
export VITE_GRADIO_API_URL="https://your-gradio-api-url"

# Make the script executable and run it
chmod +x deploy.sh
./deploy.sh
```

**Windows PowerShell:**

```powershell
# Set your environment variables
$env:PROJECT_ID = "your-project-id"
$env:VITE_API_BASE_URL = "https://your-backend-api-url"
$env:VITE_GRADIO_API_URL = "https://your-gradio-api-url"

# Run the script
.\deploy.ps1
```

#### Option 2: Manual deployment

```sh
# Build and submit to Cloud Build
gcloud builds submit --config cloudbuild.yaml

# Or build locally and deploy
docker build -t gcr.io/YOUR_PROJECT_ID/avera .
docker push gcr.io/YOUR_PROJECT_ID/avera
gcloud run deploy avera --image gcr.io/YOUR_PROJECT_ID/avera --platform managed --region us-central1 --allow-unauthenticated --port 4200
```

#### Option 3: Automated GitHub Actions (CI/CD)

Set up automatic deployment on every push to main branch:

1. **Create GitHub Secrets:**

    - `GCP_PROJECT_ID`: Your Google Cloud Project ID
    - `GCP_SA_KEY`: Service Account JSON key with Cloud Run Admin and Storage Admin roles

2. **The workflow will:**
    - Build and push Docker image on every push to main
    - Deploy to Cloud Run automatically
    - Comment on commits with the service URL

### Configuration Files

-   **`cloudbuild.yaml`**: Google Cloud Build configuration for automated builds and deployments
-   **`deploy.sh`**: Bash deployment script for Linux/macOS
-   **`deploy.ps1`**: PowerShell deployment script for Windows
-   **`.gcloudignore`**: Files to exclude from Google Cloud Build context
-   **`.github/workflows/deploy.yml`**: GitHub Actions workflow for CI/CD
-   **`.env.deploy.example`**: Environment configuration template

### Services Used

-   **Cloud Build**: Automated builds and deployments
-   **Cloud Run**: Serverless container hosting
-   **Container Registry**: Docker image storage

### Environment Variables

Set these environment variables before deployment:

-   `PROJECT_ID`: Your Google Cloud Project ID
-   `REGION`: Deployment region (default: us-central1)
-   `VITE_API_BASE_URL`: Your backend API URL (e.g., https://your-backend-service-url)
-   `VITE_GRADIO_API_URL`: Your Gradio API URL for 3D avatar generation (e.g., https://your-gradio-app.gradio.live/)

### Monitoring

After deployment, monitor your application:

```sh
# View logs
gcloud logs read --filter="resource.type=cloud_run_revision AND resource.labels.service_name=avera"

# Get service URL
gcloud run services describe avera --region=us-central1 --format="value(status.url)"
```

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
