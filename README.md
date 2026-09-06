# NSCC SRM - Technical Task 1 (1st Year)

##  Project Overview
This project is an interactive, 3D-styled Signup Form and User Dashboard created for the NSCC Technical Task Round. It features live input validation, client-side data persistence using `localStorage`, secure password hashing using the Web Crypto API, and a fully responsive soft 3D UI (Neo-brutalism/Claymorphism).

## 🚀Features Implemented
- **Interactive UI**: Elements feature 3D shadows and transform states on hover, focus, and click. Invalid inputs trigger a custom "shake" animation.
- **Client-Side Validation**:
  - Username: Cannot be empty (requires at least 3 characters).
  - Email: Must follow a proper email format (enforced via Regex).
  - Password: Must be at least 6 characters long.
- **Password Hashing**: Passwords are securely hashed (SHA-256 via Web Crypto API) before being stored.
- **Data Persistence**: Successful signups are saved dynamically in `localStorage`.
- **Live Dashboard Table**: Displays the Username, Email, and Hashed Password dynamically. 

##  Brownie Points / Extra Features
- **Delete Functionality**: An interactive delete button added to every row in the dashboard to remove entries dynamically from both the UI and `localStorage`.
- **Basic XSS Protection**: Escapes HTML characters before rendering them into the dashboard to prevent cross-site scripting attacks.
- **Micro-interactions**: Enhanced UX via visual cues such as button presses, error states, and success pops.

## How to Run the Project
Since this is a vanilla HTML/CSS/JS project, there are no complicated installation steps!

### Option 1: Live Server (Recommended)
1. Install an extension like [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) in VS Code.
2. Open `index.html` in VS Code and click "Go Live" at the bottom right.
3. The app will launch in your default browser automatically.

### Option 2: Direct Execution
1. Clone this repository to your local machine.
2. Navigate to the project folder.
3. Double-click on `index.html` to open it in any web browser (Chrome, Firefox, Safari).

### Environment Setup
No external libraries, frameworks, or environment variables are required!

## 🧠 Concepts Learned / Utilized
- **Web Crypto API (`crypto.subtle.digest`)**: Learned how to implement asynchronous hashing (SHA-256) entirely on the client-side without relying on external libraries like bcrypt or CryptoJS.
- **DOM Manipulation & State**: Efficiently updating the DOM based on the current state of `localStorage`.
- **Advanced CSS**: Utilizing multiple inset/outset `box-shadow` layers and CSS `transform` for 3D interactions and animations.
- **Regex**: Writing and validating regular expressions for robust email formatting.
