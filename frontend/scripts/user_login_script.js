 // Import Firebase v9 modular SDK
      import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
      import {
        getAuth,
        signInWithPopup,
        GoogleAuthProvider,
        onAuthStateChanged,
        signOut,
        getIdToken,
        setPersistence, // <--- IMPORTED
        browserLocalPersistence, // <--- IMPORTED
      } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

      // Firebase project configuration (should be the same as admin login)
      const firebaseConfig = {
        apiKey: "AIzaSyCbHWUEzqGjzeanOiMG0Z5Lb4wIjWWEMUQ",
        authDomain: "docnest-f85e2.firebaseapp.com",
        projectId: "docnest-f85e2",
        storageBucket: "docnest-f85e2.appspot.com",
        messagingSenderId: "102395439437",
        appId: "1:102395439437:web:84e6676388b5d54395af04",
        measurementId: "G-YRMBR8BVSE",
      };

      let app;
      let auth;
      let googleProvider;
      let isProcessingLogin = false;

      const loginButton = document.getElementById("login-button");
      const errorMessageDiv = document.getElementById("error-message");
      const themeToggleButtonLogin = document.getElementById(
        "theme-toggle-button-login"
      );

      const sunIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>`;
      const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>`;

      function applyLoginTheme(theme) {
        if (theme === "light") {
          document.body.classList.add("light-theme");
          if (themeToggleButtonLogin)
            themeToggleButtonLogin.innerHTML = moonIcon;
          localStorage.setItem("loginTheme", "light");
        } else {
          document.body.classList.remove("light-theme");
          if (themeToggleButtonLogin)
            themeToggleButtonLogin.innerHTML = sunIcon;
          localStorage.setItem("loginTheme", "dark");
        }
      }

      if (themeToggleButtonLogin) {
        themeToggleButtonLogin.addEventListener("click", () => {
          applyLoginTheme(
            document.body.classList.contains("light-theme") ? "dark" : "light"
          );
        });
      }

      const savedLoginTheme = localStorage.getItem("loginTheme");
      const prefersDarkLogin = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      applyLoginTheme(savedLoginTheme || (prefersDarkLogin ? "dark" : "dark")); // Default to dark

      function setButtonLoadingState(isLoading) {
        const buttonTextSpan = loginButton.querySelector(".button-text");
        if (isLoading) {
          loginButton.disabled = true;
          if (buttonTextSpan) {
            buttonTextSpan.dataset.originalText = buttonTextSpan.textContent;
            buttonTextSpan.innerHTML = `<span class="spinner"></span>Signing in...`;
          }
        } else {
          loginButton.disabled = false;
          if (buttonTextSpan && buttonTextSpan.dataset.originalText) {
            buttonTextSpan.innerHTML = buttonTextSpan.dataset.originalText;
          } else if (buttonTextSpan) {
            buttonTextSpan.innerHTML = "Sign in with Google";
          }
        }
      }

      function showLoginError(message) {
        errorMessageDiv.textContent = message;
        errorMessageDiv.classList.remove("hidden");
      }

      function clearLoginError() {
        errorMessageDiv.textContent = "";
        errorMessageDiv.classList.add("hidden");
      }

      if (
        firebaseConfig.apiKey &&
        firebaseConfig.apiKey !== "YOUR_FIREBASE_API_KEY" && // More robust check
        firebaseConfig.apiKey == "AIzaSyCbHWUEzqGjzeanOiMG0Z5Lb4wIjWWEMUQ" // Also check against the placeholder you use
      ) {
        try {
          app = initializeApp(firebaseConfig);
          auth = getAuth(app);
          googleProvider = new GoogleAuthProvider();
        } catch (e) {
          console.error("Error initializing Firebase:", e);
          showLoginError(
            "Login service initialization failed. Please contact support."
          );
          if (loginButton) loginButton.disabled = true;
        }
      } else {
        console.warn(
          "Firebase config is not set with actual values or is using placeholder. Please update firebaseConfig in the script."
        );
        showLoginError(
          "Application not configured for login. Please contact support."
        );
        if (loginButton) loginButton.disabled = true;
      }

      // --- Centralized Authentication Handler for User Login ---
      async function handleUserAuthentication(user) {
        if (!user) {
          setButtonLoadingState(false);
          isProcessingLogin = false;
          return;
        }

        // No need to setButtonLoadingState(true) here if onAuthStateChanged is the primary trigger
        // for existing sessions, as the button wouldn't have been clicked.
        // If triggered by button click, setButtonLoadingState(true) is already handled in triggerGoogleSignIn.
        if (!isProcessingLogin) setButtonLoadingState(true); // Only set if not already processing from button click
        clearLoginError();

        try {
          const token = await getIdToken(user, true);

          const backendResponse = await fetch(
            "https://docnest-780614596615.asia-south1.run.app/api/auth",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );


          if (!backendResponse.ok) {
            const errorText = await backendResponse.text();
            console.error("User Login: Backend auth error:", errorText);
            let errorData = {}; // Default to empty object
            try {
              errorData = JSON.parse(errorText || "{}"); // Ensure errorText is not null/undefined
            } catch (parseError) {
              console.error(
                "Could not parse backend error response as JSON:",
                parseError
              );
              errorData.detail = errorText; // Use raw text if not JSON
            }
            throw new Error(
              errorData.detail ||
                `Authorization failed (Status: ${backendResponse.status})`
            );
          }

          const userData = await backendResponse.json();

          if (
            userData &&
            (userData.isUser === true || userData.isAdmin === true)
          ) {
            window.location.href = "userpage.html";
          } else {
            showLoginError(
              "Access Denied: You do not have authorized user privileges for this portal."
            );
            if (auth) {
              await signOut(auth).catch((e) =>
                console.error("Sign out error:", e)
              );
            }
            sessionStorage.removeItem("token"); // Ensure token is cleared
            setButtonLoadingState(false); // Re-enable button after error
          }
        } catch (error) {
          console.error("User Login: Error during authentication:", error);
          showLoginError(`Authentication failed: ${error.message}`);
          if (auth && auth.currentUser) {
            await signOut(auth).catch((e) =>
              console.error("Sign out error during catch:", e)
            );
          }
          sessionStorage.removeItem("token"); // Ensure token is cleared
          setButtonLoadingState(false); // Re-enable button after error
        } finally {
          isProcessingLogin = false; // Always reset processing flag in finally
          // Only set loading to false if it wasn't set by triggerGoogleSignIn
          if (!loginButton.disabled) {
            // A bit of a heuristic, better would be to pass a flag
            setButtonLoadingState(false);
          }
        }
      }
      // --- End Centralized Authentication Handler ---

      let initialUserAuthCheckProcessed = false;
      if (auth) {
        onAuthStateChanged(auth, (user) => {

          if (user && !isProcessingLogin && !initialUserAuthCheckProcessed) {
            initialUserAuthCheckProcessed = true;
            handleUserAuthentication(user); // This will set isProcessingLogin
          } else if (!user) {
            sessionStorage.removeItem("token");
            setButtonLoadingState(false);
            isProcessingLogin = false; // Reset if user is null
          }
        });
      }

      async function triggerGoogleSignIn() {
        if (!auth || !googleProvider) {
          showLoginError(
            "Login service not available. Please check configuration."
          );
          return;
        }
        if (isProcessingLogin) {
          return;
        }

        clearLoginError();
        setButtonLoadingState(true);
        isProcessingLogin = true;
        // initialUserAuthCheckProcessed = true; // No longer needed to set here, onAuthStateChanged will handle if needed.

        try {
          // ******** SET PERSISTENCE HERE ********
          await setPersistence(auth, browserLocalPersistence);
          // *************************************

          const result = await signInWithPopup(auth, googleProvider);
          // After successful signInWithPopup, onAuthStateChanged will fire.
          // handleUserAuthentication will be called by onAuthStateChanged.
          // However, to ensure immediate processing and UI feedback, call it here too.
          // The isProcessingLogin flag in handleUserAuthentication and onAuthStateChanged
          // should prevent redundant heavy operations.
          await handleUserAuthentication(result.user);
        } catch (err) {
          console.error("User Login: Google Sign-In Popup Error:", err);
          let friendlyMessage = "Sign-in failed. Please try again.";
          if (err.code === "auth/popup-closed-by-user") {
            friendlyMessage = "Sign-in popup closed before completion.";
          } else if (err.code === "auth/network-request-failed") {
            friendlyMessage = "Network error. Please check your connection.";
          } else if (
            err.code === "auth/cancelled-popup-request" ||
            err.code === "auth/popup-blocked"
          ) {
            friendlyMessage =
              "Sign-in popup was blocked or cancelled. Please try again and allow popups.";
          }
          showLoginError(friendlyMessage);
          // Error occurred, so reset state. handleUserAuthentication's finally block might not run if error is before its call.
          setButtonLoadingState(false);
          isProcessingLogin = false;
        }
        // Note: handleUserAuthentication has its own finally block to reset isProcessingLogin
        // and setButtonLoadingState(false) upon completion or error within it.
      }

      if (loginButton) {
        loginButton.addEventListener("click", triggerGoogleSignIn);
      } else {
        console.error("Login button not found.");
      }