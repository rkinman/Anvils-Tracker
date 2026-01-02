# Anvils Tracker

A personal trading journal and dashboard built with React, Vite, and Supabase.

## Quick Start

Follow these steps to deploy your own instance of the application.

### Prerequisites

-   A free [GitHub](https://github.com) account.
-   A free [Supabase](https://supabase.com/) account.
-   A free [Vercel](https://vercel.com/) account.

### 1. Deploy to Vercel

1.  **Get the Repository URL:**
    -   Scroll to the top of this GitHub page.
    -   Click the green **Code** button.
    -   Select the **Local** tab and verify **HTTPS** is selected.
    -   Copy the web URL provided.
    
    > [!TIP]
    > **Optional:** You can click the **Fork** button in the top right first if you want to create your own copy of the repository in your GitHub account. However, this is not required! Vercel can handle this for you during import.

    ![Clone Button](/public/assets/github_code_button.png)

2.  **Create Project in Vercel:**
    -   Go to your [Vercel Dashboard](https://vercel.com/dashboard).
    -   Click **Add New...** -> **Project**.
    -   Paste the GitHub URL you just copied into the import field.
    -   Click **Import**.

3.  **Deploy:**
    -   Enter a **Project Name** (use lowercase, e.g., `my-trade-tracker`).
    -   Leave all other settings as default (Framework Preset: Vite, Root Directory: ./).
    -   Click **Deploy**.

    *All build settings and environment variables will be configured automatically.*

### 2. Setup & Configuration

Once deployed, visit your new site URL. You will be automatically redirected to the **Setup Wizard**.

1.  **Connect to Supabase:**
    -   Create a new project at [database.new](https://database.new) (free tier is fine).
    -   **Important:** Once your project is created, scroll down the dashboard page to find your **Project URL** and **Anon Key**. You have to scroll down to see them.
    
    ![Supabase Keys](/public/assets/supabase_keys.png)
2.  **Initialize Database:**
    -   The Setup Wizard will provide a **Schema SQL** script.
    -   Copy the script and run it in your Supabase **SQL Editor**.
    -   This creates all necessary tables and security policies.


### 3. Configure Authentication (Important!)

The Setup Wizard will guide you through this final step. You'll need to update the **URL Configuration** in Supabase so that login and email confirmations redirect to your Vercel URL instead of `localhost`.

1.  Go to your Supabase **Authentication** -> **URL Configuration**.
2.  **Site URL**: Set this to your Vercel URL.
3.  **Redirect URLs**: Add your Vercel URL followed by `/**`.

Now you can sign up and log in securely!
 


