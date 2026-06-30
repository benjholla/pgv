import sys
from playwright.sync_api import sync_playwright
import time

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto('http://127.0.0.1:5173/')
        page.wait_for_selector('.pgv-search-bar')

        # Select "Node Attribute" search mode
        page.select_option('select[aria-label="Search mode"]', 'node-attribute')

        # Type into the attribute value input
        page.fill('input[aria-label="Search attribute value"]', 'Entry')
        time.sleep(0.5)

        # Take screenshot
        page.screenshot(path="screenshot.png")

        print(f"Info text after value: {page.locator('.pgv-search-results-info').inner_text()}")

        browser.close()

if __name__ == '__main__':
    main()
