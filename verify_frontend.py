from playwright.sync_api import sync_playwright

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to local web app
        page.goto("http://localhost:8081")

        # Wait a bit for JS to load
        page.wait_for_timeout(3000)

        # Take a screenshot
        page.screenshot(path="/tmp/miru-frontend-verification.png", full_page=True)

        browser.close()

if __name__ == "__main__":
    verify_frontend()
