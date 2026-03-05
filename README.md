# 🗓️ Angular Timeline & Work Order Management

A Timeline and Work Order management UI built entirely in Angular, featuring dynamic timescale Zoom levels.

---

## 🚀 Features

* **Dynamic Timescale Toggling:** Seamlessly switch the background grid between **Day**, **Week**, and **Month** views. The grid dynamically recalculates column widths based on the exact number of days in a specific month.
* **Precise "Today" Indicator:** A floating badge that calculates the exact geometric pixel center of the current day/week/month column and anchors itself flawlessly.
* **Status Theming:** Automatically color-coded work order bars based on status (`Open`, `In-progress`, `Complete`, `Blocked`).

## 🛠 Tech Stack

* **Frontend Framework:** Angular 
* **Styling:** SCSS / CSS Flexbox
* **Libraries:** `@ng-select/ng-select`, `@ng-bootstrap/ng-bootstrap`

## 📦 Installation

Follow these steps to get your development environment running:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/ashah-004/Naologic-Timeline.git
    ```
2.  **Navigate to the directory:**
    ```bash
    cd project-name
    ```
3.  **Install dependencies:**
    ```bash
    npm install
    ```

## 🖥️ Usage

Start the development server to view and interact with the timeline.

```bash
# To start the development server
ng serve
