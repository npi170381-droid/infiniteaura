# 🎟️ Movie Ticket Booking System - Deployment Guide

This project is configured with a **Render Blueprint (`render.yaml`)** to host both the React frontend and Node/Express backend together as a single service for free in just a few clicks.

---

## 🛠️ Step-by-Step Instructions

### Step 1: Upload Your Code to GitHub
1. Create a repository on your **GitHub** account.
2. Push this project folder (`ticket`) to your GitHub repository.

---

### Step 2: Deploy to Render.com (100% Free)
1. Go to **[Render.com](https://render.com/)** and create a free account (or log in).
2. Click the **"New"** button in the top-right corner.
3. Select **"Blueprint"** from the menu.
4. Connect your GitHub account and select your project's repository.
5. Give your blueprint group a name (e.g., `ticket-app`).
6. Click **"Apply"**.

---

## 🎉 What Happens Next?
Render will automatically read the `render.yaml` configuration file and:
1.  Install all dependencies and run `npm run build` to compile the React frontend.
2.  Start the Node.js Express server (`node server.js`).
3.  Serve the entire application (both the frontend and API) from a single URL!
