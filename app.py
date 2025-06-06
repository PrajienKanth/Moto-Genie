from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session
import pandas as pd
import google.generativeai as genai
from dotenv import load_dotenv
from datetime import datetime, timedelta
import os
import logging
logging.basicConfig(level=logging.INFO)


# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

# GenAI Configuration
genai_api_key = os.getenv('GENAI_API_KEY')  # Replace with your actual GenAI API key
genai.configure(api_key=genai_api_key)

app.secret_key = os.getenv("FLASK_SECRET_KEY")

# Load datasets
try:
    cars_df = pd.read_csv("cars-dataset.csv")
    bikes_df = pd.read_csv("bike_data.csv")
except FileNotFoundError as e:
    print(f"Error loading datasets: {e}")
    cars_df = pd.DataFrame()
    bikes_df = pd.DataFrame()


   
# Function to generate response using GenAI
def generate_response(prompt):
    """Generate a response using GenAI."""
    model = genai.GenerativeModel(
        model_name="gemini-1.5-pro",
        generation_config={
            "temperature": 0.7,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 1024
        }
    )
    chat_session = model.start_chat(history=[])
    response = chat_session.send_message(prompt)
    return response.text


@app.route("/")
def home():
    return render_template("index.html")

@app.route("/car")
def car():
    companies = cars_df["Company"].unique()
    company_models = {company: cars_df[cars_df["Company"] == company]["Model"].unique().tolist() for company in companies}
    return render_template("car.html", companies=companies, company_models=company_models)

@app.route("/car_specification", methods=["GET", "POST"])
def car_specification():
    companies = cars_df["Company"].unique()
    company_models = {company: cars_df[cars_df["Company"] == company]["Model"].unique().tolist() for company in companies}

    if request.method == "POST":
        company = request.form.get("company")
        model = request.form.get("model")
        user_query = request.form.get("user_query")

        # Filter dataset for the selected car
        filtered_car = cars_df[(cars_df["Company"] == company) & (cars_df["Model"] == model)]

        if not filtered_car.empty:
            car_details = filtered_car.iloc[0].to_dict()
            # Construct the prompt for GenAI
            prompt =(f"You are a car expert. Based on the following details, answer the user's question:\nCar Details: {car_details}\nUser's Question: {user_query}"
                     f"You are an expert in vehicle specifications.\n\n"
                     "Please provide a detailed answer to the user's question."
                     "The answer should be detailed and informative."
                     "Please include all relevant details and comparisons with other vehicles if necessary."
                     "The answer should be at least 100 words long."
                     )


            try:
                # Get response from GenAI
                response = generate_response(prompt)
                return render_template("car_specification.html", car_details=car_details, response=response, companies=companies, company_models=company_models)
            except Exception as e:
                return render_template("car_specification.html", error=f"Error: {str(e)}", companies=companies, company_models=company_models)
        else:
            return render_template("car_specification.html", error="No car found with the specified details.", companies=companies, company_models=company_models)
    
    return render_template("car_specification.html", companies=companies, company_models=company_models)

@app.route("/car_comparison", methods=["GET", "POST"])
def car_comparison():
    companies = cars_df["Company"].unique()
    company_models = {company: cars_df[cars_df["Company"] == company]["Model"].unique().tolist() for company in companies}

    if request.method == "POST":
        company1 = request.form.get("company1")
        model1 = request.form.get("model1")
        company2 = request.form.get("company2")
        model2 = request.form.get("model2")
        user_requirements = request.form.get("user_requirements")

        # Filter dataset for both cars
        car1 = cars_df[(cars_df["Company"] == company1) & (cars_df["Model"] == model1)]
        car2 = cars_df[(cars_df["Company"] == company2) & (cars_df["Model"] == model2)]

        if not car1.empty and not car2.empty:
            car1_details = car1.iloc[0].to_dict()
            car2_details = car2.iloc[0].to_dict()
            # Construct the prompt for GenAI
            prompt = f"You are a car expert. Compare the following two cars:\nCar 1 Details: {car1_details}\nCar 2 Details: {car2_details}\nUser's Requirements: {user_requirements}"

            try:
                # Get comparison report from GenAI
                response = generate_response(prompt)
                return render_template("car_comparison.html", car1_details=car1_details, car2_details=car2_details, response=response, companies=companies, company_models=company_models)
            except Exception as e:
                return render_template("car_comparison.html", error=f"Error: {str(e)}", companies=companies, company_models=company_models)
        else:
            return render_template("car_comparison.html", error="One or both cars not found.", companies=companies, company_models=company_models)
    
    return render_template("car_comparison.html", companies=companies, company_models=company_models)

@app.route("/bike")
def bike():
    companies = bikes_df["company_name"].unique()
    company_models = {
        company: bikes_df[bikes_df["company_name"] == company]["model"].unique().tolist()
        for company in companies
    }
    return render_template("bike.html", companies=companies, company_models=company_models)

@app.route("/bike_specification", methods=["GET", "POST"])
def bike_specification():
    companies = bikes_df["company_name"].unique()
    company_models = {
        company: bikes_df[bikes_df["company_name"] == company]["model"].unique().tolist()
        for company in companies
    }

    if request.method == "POST":
        company = request.form.get("company")
        model = request.form.get("model")
        user_query = request.form.get("user_query")

        # Filter dataset for the selected bike
        filtered_bike = bikes_df[(bikes_df["company_name"] == company) & (bikes_df["model"] == model)]

        if not filtered_bike.empty:
            bike_details = filtered_bike.iloc[0].to_dict()
            # Construct the prompt for GenAI
            prompt = f"You are a bike expert. Based on the following details, answer the user's question:\nBike Details: {bike_details}\nUser's Question: {user_query}"

            try:
                # Get response from GenAI
                response = generate_response(prompt)
                return render_template(
                    "bike_specification.html",
                    bike_details=bike_details,
                    response=response,
                    companies=companies,
                    company_models=company_models,
                )
            except Exception as e:
                return render_template(
                    "bike_specification.html",
                    error=f"Error: {str(e)}",
                    companies=companies,
                    company_models=company_models,
                )
        else:
            return render_template(
                "bike_specification.html",
                error="No bike found with the specified details.",
                companies=companies,
                company_models=company_models,
            )

    return render_template(
        "bike_specification.html",
        companies=companies,
        company_models=company_models,
    )

@app.route("/bike_comparison", methods=["GET", "POST"])
def bike_comparison():
    companies = bikes_df["company_name"].unique()
    company_models = {
        company: bikes_df[bikes_df["company_name"] == company]["model"].unique().tolist()
        for company in companies
    }

    if request.method == "POST":
        company1 = request.form.get("company1")
        model1 = request.form.get("model1")
        company2 = request.form.get("company2")
        model2 = request.form.get("model2")
        user_requirements = request.form.get("user_requirements")

        # Filter dataset for the selected bikes
        bike1 = bikes_df[(bikes_df["company_name"] == company1) & (bikes_df["model"] == model1)]
        bike2 = bikes_df[(bikes_df["company_name"] == company2) & (bikes_df["model"] == model2)]

        if not bike1.empty and not bike2.empty:
            bike1_details = bike1.iloc[0].to_dict()
            bike2_details = bike2.iloc[0].to_dict()
            
            # Construct the prompt for GenAI
            prompt = f"You are a bike expert. Compare the following two bikes:\nBike 1 Details: {bike1_details}\nBike 2 Details: {bike2_details}\nUser's Requirements: {user_requirements}"

            try:
                # Get comparison report from GenAI
                response = generate_response(prompt)
                
                return render_template(
                    "bike_comparison.html",
                    bike1_details=bike1_details,
                    bike2_details=bike2_details,
                    response=response,
                    companies=companies,
                    company_models=company_models,
                )
            except Exception as e:
                return render_template(
                    "bike_comparison.html",
                    error=f"Error: {str(e)}",
                    companies=companies,
                    company_models=company_models,
                )
        else:
            return render_template(
                "bike_comparison.html",
                error="One or both bikes were not found. Please select valid bikes.",
                companies=companies,
                company_models=company_models,
            )

    return render_template(
        "bike_comparison.html",
        companies=companies,
        company_models=company_models,
    )

@app.route("/fuel_cost")
def fuel_cost():
    return render_template("fuel_cost.html")

@app.route("/fuel_cost", methods=["GET", "POST"])
def calculate_fuel_cost():
    fuel_cost = None
    if request.method == "POST":
        distance = float(request.form.get("distance"))
        fuel_efficiency = float(request.form.get("fuel_efficiency"))
        fuel_price = float(request.form.get("fuel_price"))

        # Calculate fuel cost
        fuel_cost = (distance / fuel_efficiency) * fuel_price

    return render_template("fuel_cost.html", fuel_cost=fuel_cost)

# Session timeout duration
INACTIVITY_TIMEOUT = timedelta(minutes=30)

@app.route('/chat', methods=['POST'])
def chat_endpoint():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()
    user_message = data.get('message')

    if not user_message:
        return jsonify({"error": "No message provided"}), 400

    # Check for inactivity timeout
    now = datetime.utcnow()
    last_active = session.get('last_active')

    if last_active:
        last_active = datetime.strptime(last_active, '%Y-%m-%d %H:%M:%S')
        if now - last_active > INACTIVITY_TIMEOUT:
            session.pop('chat_history', None)  # Clear old chat history
            session['chat_history'] = ""       # Start fresh

    # Update last active time
    session['last_active'] = now.strftime('%Y-%m-%d %H:%M:%S')

    # Get or initialize chat history
    chat_history = session.get('chat_history', "")
    chat_history += f"User: {user_message}\n"

    prompt = f"""
        You are 'Moto Genie Assistant', a smart and friendly AI chatbot on the Moto Genie website.

        🧠 Your role is to:
        - Provide car and bike **specifications**, **comparisons**, **fuel price details**, and **recommendations**.
        - Understand and maintain the **context of the conversation** across multiple user messages.
        - Ask **follow-up questions** when needed, and give **detailed answers** based on previous user replies.

        📚 You have access to:
        - `cars_df` (cars-dataset.csv)
        - `bikes_df` (bike_data.csv)

        💬 Example Conversation Flow:
        User: "Show me KTM bikes"  
        → You: "Sure! I found several KTM models. Could you tell me which one you're interested in, like Duke 200 or RC 390?"  
        User: "Duke 200"  
        → You: "Great choice! The KTM 200 Duke has a powerful single-cylinder engine with approx. 25 bhp, a top speed of 138 km/h, and a mileage of 35 kmpl. The price starts at ₹[from dataset]."

        ✅ Key Behaviors:
        - **Use context**: Remember previous user inputs to make responses natural.
        - **Avoid repetition**: Don’t repeat full specs if the user asks follow-up questions.
        - **Ask for clarification** if a model or company is too general.
        - If data is not found, **politely inform the user** and suggest using Moto Genie’s tools.

        🚫 For unrelated questions (not about vehicles or Moto Genie services), say:
        "I'm here to assist with cars and bikes on the Moto Genie platform. Please ask something vehicle-related."

        ⚠️ Important:
        - Do NOT guess or invent details.
        - Use ONLY the data from the provided datasets.

        ---

        User Conversation So Far:
        {chat_history}

        Current User Message:
        {user_message}

        Moto Genie Assistant’s Response:
        """

    try:
        ai_response = generate_response(prompt)

        # Update session chat history
        chat_history += f"Moto Genie Assistant: {ai_response}\n"
        session['chat_history'] = chat_history

        return jsonify({"response": ai_response})
    except Exception as e:
        app.logger.error(f"Chatbot AI error: {e}")
        return jsonify({"response": "Sorry, I'm having trouble connecting right now."}), 500


@app.errorhandler(404)
def not_found_error(error):
    return render_template("404.html"), 404

@app.errorhandler(500)
def internal_server_error(error):
    return render_template("500.html"), 500


if __name__ == "__main__":
    app.run(debug=True)