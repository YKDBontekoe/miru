import os
import tempfile
from playwright.sync_api import sync_playwright

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to local web app
        page.goto("http://localhost:8081")

        # Wait for the network to be idle to ensure app is ready
        page.wait_for_load_state('networkidle')

        # Build safe cross-platform temp file path
        screenshot_path = os.path.join(tempfile.gettempdir(), "miru-frontend-verification.png")

        # Take a screenshot
        page.screenshot(path=screenshot_path, full_page=True)

        browser.close()

if __name__ == "__main__":
    verify_frontend()
