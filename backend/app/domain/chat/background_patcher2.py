with open("app/domain/chat/background_service.py") as f:
    content = f.read()

content = content.replace(
    """            response_generator = stream_chat(
                model="gpt-4o-mini", # Use a fast/cheap model for summarization
                messages=[{"role": "user", "content": prompt}]
            )""",
    """
            # Ensure model is fetched correctly or hardcode model string if stream_chat accepts it
            model_name = "gpt-4o-mini"
            try:
                from app.core.config import get_settings
                model_name = get_settings().default_chat_model
            except Exception:
                pass

            response_generator = await stream_chat(
                model=model_name, # Use a fast/cheap model for summarization
                messages=[{"role": "user", "content": prompt}]
            )""",
)

with open("app/domain/chat/background_service.py", "w") as f:
    f.write(content)
