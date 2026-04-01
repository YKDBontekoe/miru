import os
import tempfile
from playwright.sync_api import sync_playwright

def verify_frontend():
    with sync_playwright() as p:
        # Use iPhone 13 profile
        iphone_13 = p.devices['iPhone 13']
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(**iphone_13)
        page = context.new_page()

        # Navigate to our specific test layout directly
        page.goto("http://localhost:8081/test_layout")

        # Give it a bit of time to render
        page.wait_for_timeout(3000)

        # Build safe cross-platform temp file path
        screenshot_path = os.path.join(
            tempfile.gettempdir(), "miru-frontend-verification.png"
        )

        # Take a screenshot
        page.screenshot(path=screenshot_path, full_page=True)

        browser.close()

if __name__ == "__main__":
    verify_frontend()
