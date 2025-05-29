# ESL Teaching Assistant

An AI-powered application to assist with ESL teaching, offering interactive tools and resources.

## Run Locally

**Prerequisites:**  
- Node.js (Ensure you have a compatible version installed, e.g., `^18.0.0 || ^20.0.0 || >=22.0.0`)

### Steps to Run:

1. **Install dependencies**:  
   Run the following command to install all required dependencies:  
   ```bash
   npm install
   ```

2. **Set the API Key**:  
   Open the `.env.local` file and replace `PLACEHOLDER_API_KEY` with your Gemini API key:  
   ```bash
   GEMINI_API_KEY=your_api_key_here
   ```

3. **Start the development server**:  
   Run the following command to start the app locally:  
   ```bash
   npm run dev
   ```

## Build and Deploy

To build the application for production, run:  
```bash
npm run build
```

To preview the production build locally, run:  
```bash
npm run preview
```

## License

This project is licensed under [MIT License](LICENSE).