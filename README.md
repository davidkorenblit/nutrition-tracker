# DailyBite - AI-Powered Nutrition Companion

DailyBite is a full-stack platform designed to bridge the gap between professional nutritionist recommendations and daily execution. The system transforms static professional notes into dynamic, actionable insights using Generative AI.

## The AI Edge: Contextual Analysis vs. Keyword Matching

The core innovation of DailyBite is the shift from traditional filtering to intelligent understanding:

* **Beyond Regex:** Traditional applications use Regular Expressions or keyword matching, which are limited to finding specific strings. DailyBite uses Google Gemini AI to understand the context of the nutritionist's advice.
* **Semantic Understanding:** The system distinguishes between nuanced instructions, such as "Increase protein intake only on training days," ensuring the user receives the right advice at the right time.
* **Actionable Insights:** AI analyzes the professional reports and generates daily goals that adapt to the user's logged behavior, recognizing synonyms and related nutritional concepts automatically.

## Tech Stack

* **Frontend:** React.js, Tailwind CSS, Axios.
* **Backend:** FastAPI (Python), SQLAlchemy, Pydantic.
* **AI Engine:** Google Gemini Pro API.
* **Database:** SQLite (Containerized).
* **DevOps:** Docker and Docker Compose.
* **Deployment:** Fully containerized and optimized for cloud environments.

## Key Features

* **Nutritionist Interface:** A dedicated portal for professionals to upload complex, free-text dietary recommendations.
* **AI Recommendation Engine:** Processes professional input into structured compliance logic for the end-user.
* **Comprehensive Tracking:** Logging systems for meals, snacks, water intake, and subjective hunger levels.
* **Compliance Dashboard:** Real-time feedback on how well daily habits align with the AI-interpreted goals.

## Deployment and Usage

The application is built to run in a containerized environment, ensuring consistency between development and production.

### Prerequisites

* Docker and Docker Compose installed.
* Google Gemini API Key.

### Cloud Deployment

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/davidkorenblit/dailybite.git](https://github.com/davidkorenblit/dailybite.git)
    cd dailybite
    ```

2.  **Configuration:**
    Update the `docker-compose.yml` file with the production environment variables, including the `GOOGLE_API_KEY` and backend service URLs.

3.  **Build and Run:**
    ```bash
    docker-compose up --build -d
    ```

## Architecture and Security

* **CORS Management:** Configured for secure cross-origin communication between the frontend and backend cloud domains.
* **Stateless Authentication:** Implemented via JWT for secure user sessions.
* **Scalability:** The containerized architecture allows for easy scaling of individual services.

---
Developed by David - Full Stack Developer
