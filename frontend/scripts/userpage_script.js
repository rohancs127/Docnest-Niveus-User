const firebaseConfig = {
        apiKey: "AIzaSyCbHWUEzqGjzeanOiMG0Z5Lb4wIjWWEMUQ", // Replace with your actual API key
        authDomain: "docnest-f85e2.firebaseapp.com",
        projectId: "docnest-f85e2",
        storageBucket: "docnest-f85e2.appspot.com",
        messagingSenderId: "102395439437",
        appId: "1:102395439437:web:84e6676388b5d54395af04",
        measurementId: "G-YRMBR8BVSE",
      };

      // --- Global Helper Functions (Toast, Button Loading, Escape, Debounce) ---
      window.showNotification = function (
        message,
        type = "success",
        duration = 3000
      ) {
        const toastContainer = document.getElementById("toast-container");
        if (!toastContainer) return;
        const toast = document.createElement("div");
        toast.classList.add("toast", type);
        let iconHtml = "";
        if (type === "success") {
          iconHtml = `<svg class="toast-icon h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>`;
        } else if (type === "error") {
          iconHtml = `<svg class="toast-icon h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.293-10.293a1 1 0 00-1.414 0L9 8.586l-.293-.293a1 1 0 10-1.414 1.414L7.586 10l-.293.293a1 1 0 101.414 1.414L9 11.414l.293.293a1 1 0 001.414-1.414L10.414 10l.293-.293a1 1 0 000-1.414z" clip-rule="evenodd" /></svg>`;
        }
        toast.innerHTML = `${iconHtml}<span>${message}</span>`;
        toastContainer.appendChild(toast);
        toast.offsetHeight;
        toast.classList.add("show");
        setTimeout(() => {
          toast.classList.remove("show");
          setTimeout(() => {
            toast.remove();
          }, 300);
        }, duration);
      };

      window.setButtonLoading = function (
        button,
        isLoading,
        originalText = null
      ) {
        if (!(button instanceof HTMLElement)) {
          console.error("setButtonLoading: invalid button", button);
          return;
        }
        const buttonTextSpan = button.querySelector(".button-text");
        const defaultOriginal = buttonTextSpan
          ? buttonTextSpan.dataset.originalText || buttonTextSpan.textContent
          : button.dataset.originalText || button.textContent;

        if (isLoading) {
          button.disabled = true;
          if (buttonTextSpan) {
            if (
              originalText !== null &&
              typeof buttonTextSpan.dataset.originalText === "undefined"
            )
              buttonTextSpan.dataset.originalText = defaultOriginal;
            buttonTextSpan.innerHTML = `<span class="spinner"></span>Processing...`;
          } else {
            if (
              originalText !== null &&
              typeof button.dataset.originalText === "undefined"
            )
              button.dataset.originalText = defaultOriginal;
            button.innerHTML = `<span class="spinner"></span>Processing...`;
          }
        } else {
          button.disabled = false;
          if (buttonTextSpan) {
            buttonTextSpan.innerHTML =
              originalText || buttonTextSpan.dataset.originalText || "Submit";
            delete buttonTextSpan.dataset.originalText;
          } else {
            button.innerHTML =
              originalText || button.dataset.originalText || "Submit";
            delete button.dataset.originalText;
          }
        }
      };
      function escapeJSString(str) {
        if (typeof str !== "string") return "";
        return str
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;")
          .replace(/`/g, "&#96;");
      }
      function debounce(func, delay) {
        let timeoutId;
        return function (...args) {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            func.apply(this, args);
          }, delay);
        };
      }

      function formatDateForDisplay(dateString) {
        if (!dateString) return "N/A";
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "Invalid Date"; // Check for invalid date
            // Example: Jan 1, 2023, 5:30 PM
            return date.toLocaleString(undefined, {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit', hour12: true
            });
        } catch (e) {
            console.warn("Failed to format date:", dateString, e);
            return dateString; // return original if formatting fails
        }
      }

      // Helper to get all artifacts recursively from a folder node using its ID and the main tree data
      function getAllArtifactsFromRawNodeRecursive(folderNodeId, treeData, allArtifacts = [], visitedFolderIds = new Set()) {
          if (!folderNodeId || visitedFolderIds.has(folderNodeId)) {
              return allArtifacts;
          }
          visitedFolderIds.add(folderNodeId);

          const folderNode = findNodeInTree(folderNodeId, treeData); // findNodeInTree is an existing function
          if (!folderNode) return allArtifacts;

          if (folderNode.artifacts && Array.isArray(folderNode.artifacts)) {
              allArtifacts.push(...folderNode.artifacts.map(a => ({...a, parentNodeName: folderNode.name, parentNodeId: folderNode.id }))); // Add parent info
          }

          if (folderNode.children && Array.isArray(folderNode.children)) {
              for (const childNode of folderNode.children) {
                  getAllArtifactsFromRawNodeRecursive(childNode.id, treeData, allArtifacts, visitedFolderIds);
              }
          }
          return allArtifacts;
      }

      function getCalculatedFolderUpdatedAt(folderNodeFromTree) {
          if (!folderNodeFromTree || folderNodeFromTree.id === null) return null; // Do not calculate for the root "Knowledge Base"

          const allContainedArtifacts = getAllArtifactsFromRawNodeRecursive(folderNodeFromTree.id, fullTreeData, [], new Set());

          if (allContainedArtifacts.length === 0) {
            // If no artifacts, consider the folder's own creation time as its "update" time, or null
            return folderNodeFromTree.createdAt ? new Date(folderNodeFromTree.createdAt).toISOString() : null;
          }

          let mostRecentArtifactUpdate = null;
          if (folderNodeFromTree.createdAt) { // Initialize with folder's own creation date if available
            mostRecentArtifactUpdate = new Date(folderNodeFromTree.createdAt);
          }


          for (const artifact of allContainedArtifacts) {
              if (artifact.updatedAt) {
                  const artifactDate = new Date(artifact.updatedAt);
                  if (!isNaN(artifactDate.getTime())) {
                      if (!mostRecentArtifactUpdate || artifactDate > mostRecentArtifactUpdate) {
                          mostRecentArtifactUpdate = artifactDate;
                      }
                  }
              } else if (artifact.createdAt) { // Fallback to createdAt if updatedAt is missing for an artifact
                  const artifactCreationDate = new Date(artifact.createdAt);
                   if (!isNaN(artifactCreationDate.getTime())) {
                      if (!mostRecentArtifactUpdate || artifactCreationDate > mostRecentArtifactUpdate) {
                          mostRecentArtifactUpdate = artifactCreationDate;
                      }
                  }
              }
          }
          return mostRecentArtifactUpdate ? mostRecentArtifactUpdate.toISOString() : null;
      }
      // --- End Global Helper Functions ---

      // --- Firebase Initialization ---
      let firebaseApp;
      let firebaseAuth;

      if (firebaseConfig.apiKey === "AIzaSyCbHWUEzqGjzeanOiMG0Z5Lb4wIjWWEMUQ") {
        // Check against the common placeholder
        console.warn(
          "User Page: Firebase API Key is a placeholder. Real functionality will be limited."
        );
        // Proceed with initialization for local testing, but it won't connect to Firebase.
        try {
          firebaseApp = firebase.initializeApp(firebaseConfig);
          firebaseAuth = firebase.auth();
        } catch (e) {
          console.error(
            "User Page: Error initializing Firebase with placeholder:",
            e
          );
          window.showNotification(
            "Critical Error: Auth service init failed (placeholder).",
            "error",
            10000
          );
        }
      } else {
        try {
          firebaseApp = firebase.initializeApp(firebaseConfig);
          firebaseAuth = firebase.auth();
        } catch (e) {
          console.error("User Page: Error initializing Firebase:", e);
          window.showNotification(
            "Critical Error: Firebase Auth service initialization failed.",
            "error",
            10000
          );
          if (
            document.body &&
            !window.location.pathname.endsWith("user_login.html")
          ) {
            document.body.innerHTML =
              '<div style="padding: 20px; text-align: center; font-size: 1.2em; color: red;">Application cannot start: Firebase configuration is missing or invalid.</div>';
          }
        }
      }
      // --- End Firebase Initialization ---

      // --- DOM Elements ---
      const userMenuButton = document.getElementById("user-menu-button");
      const userDisplayNameSpan = document.getElementById("user-display-name");
      const userDropdownMenu = document.getElementById("user-dropdown-menu");
      const dropdownUserName = document.getElementById("dropdown-user-name");
      const dropdownUserEmail = document.getElementById("dropdown-user-email");
      const logoutButtonDropdown = document.getElementById(
        "logout-button-dropdown"
      );
      const searchInputElement = document.getElementById("search-input");
      const breadcrumbContainer = document.getElementById(
        "breadcrumb-container"
      );
      const folderContentContainer = document.getElementById(
        "folder-content-container"
      );
      const addItemToFolderBtn = document.getElementById(
        "add-item-to-current-folder-button"
      );
      const addItemFormContainer = document.getElementById(
        "add-item-form-container"
      );
      const currentFolderNameEl = document.getElementById(
        "current-folder-name"
      );
      const loadingPlaceholder = document.getElementById("loading-placeholder");
      const backButton = document.getElementById("back-button");
      // --- End DOM Elements ---

      // --- Global State ---
      let currentUserRoles = [];
      let fullTreeData = [];
      let currentPath = [];
      let currentViewNodeId = null;
      let isSearchViewActive = false;
      // --- End Global State ---

      // ================================================================
      // DYNAMIC BACKEND URL CONFIGURATION
      // ================================================================
      let BASE_API_URL;
      const localBaseUrl = "https://docnest-780614596615.asia-south1.run.app"; // Replace with your actual local backend URL if different
      const cloudRunBaseUrl =
        "https://docnest-780614596615.asia-south1.run.app"; // Replace with your actual Cloud Run URL

      if (
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
      ) {
        BASE_API_URL = localBaseUrl;
      } else {
        BASE_API_URL = cloudRunBaseUrl;

        if (
          cloudRunBaseUrl.includes("your-userpage-backend-url") || // Common placeholder
          cloudRunBaseUrl.includes("your-actual-cloud-run-url") // Another placeholder
        ) {
          const warningMessage =
            "CRITICAL: User Page Cloud Run URL (BASE_API_URL) is a placeholder! API calls will likely fail. Please update 'cloudRunBaseUrl' in the script.";
          console.error(warningMessage);
          if (window.showNotification) {
            window.showNotification(warningMessage, "error", 60000);
          } else {
            alert(warningMessage);
          }
          if (loadingPlaceholder) {
            loadingPlaceholder.innerHTML = `<p class="p-4 text-lg text-[var(--text-red-accent)]">${warningMessage}</p>`;
            loadingPlaceholder.style.display = "flex";
          }
        }
      }
      // ================================================================

      // --- Authentication & Authorization ---
      if (firebaseAuth) {
        firebaseAuth.onAuthStateChanged(async (user) => {
          if (user) {
            if (userDisplayNameSpan)
              userDisplayNameSpan.textContent =
                user.displayName || user.email.split("@")[0];
            if (dropdownUserName)
              dropdownUserName.textContent = user.displayName || "N/A";
            if (dropdownUserEmail) dropdownUserEmail.textContent = user.email;

            if (
              BASE_API_URL &&
              !BASE_API_URL.includes("your-userpage-backend-url") && // Check against placeholders
              !BASE_API_URL.includes("your-actual-cloud-run-url")
            ) {
              await loadInitialDataConcurrently();
            } else {
              console.error(
                "User Page: Backend API URL is not properly configured. Halting data load."
              );
              if (loadingPlaceholder) {
                loadingPlaceholder.innerHTML = `<p class="p-4 text-lg text-[var(--text-red-accent)]">Application error: Backend service URL is not configured. Please contact support.</p>`;
                loadingPlaceholder.style.display = "flex";
              }
              if (firebaseAuth)
                // Sign out if config is bad
                await firebaseAuth
                  .signOut()
                  .catch((e) =>
                    console.error("Error signing out due to config issue:", e)
                  );
            }
          } else {
            sessionStorage.removeItem("userToken");
            currentUserRoles = [];
            fullTreeData = [];
            if (!window.location.pathname.endsWith("user_login.html")) {
              window.location.href = "user_login.html";
            }
          }
        });
      } else {
        console.error(
          "User Page: Firebase Auth service is not available. Cannot proceed."
        );
        if (!window.location.pathname.endsWith("user_login.html")) {
          if (loadingPlaceholder) {
            loadingPlaceholder.innerHTML =
              '<p class="p-4 text-lg text-[var(--text-red-accent)]">Authentication service failed to initialize. Please check configuration or contact support. You may need to <a href="user_login.html" class="text-[var(--text-link)]">login again</a>.</p>';
            loadingPlaceholder.style.display = "flex";
          }
          setTimeout(() => {
            // Give user time to see message before redirect
            if (!window.location.pathname.endsWith("user_login.html")) {
              window.location.href = "user_login.html";
            }
          }, 3000);
        }
      }

      async function getAuthToken() {
        if (!firebaseAuth || !firebaseAuth.currentUser) {
          console.warn(
            "User Page: No Firebase current user for token request. Redirecting to login."
          );
          if (!window.location.pathname.endsWith("user_login.html")) {
            window.location.href = "user_login.html";
          }
          return null;
        }
        try {
          const token = await firebaseAuth.currentUser.getIdToken(true); // Force refresh
          sessionStorage.setItem("userToken", token);
          return token;
        } catch (error) {
          console.error("User Page: Error getting ID token:", error);
          window.showNotification(
            "Your session may have expired. Please try logging in again.",
            "error",
            5000
          );
          if (firebaseAuth) {
            // Attempt to sign out if token fails
            await firebaseAuth
              .signOut()
              .catch((e) =>
                console.error("User Page: Signout failed after token error", e)
              );
          } else if (!window.location.pathname.endsWith("user_login.html")) {
            // Fallback redirect if signOut also problematic
            window.location.href = "user_login.html";
          }
          return null;
        }
      }

      async function secureFetch(url, options = {}) {
        const token = await getAuthToken();
        if (!token) {
          throw new Error(
            "Authentication token unavailable. User might be logged out or session expired."
          );
        }

        const headers = { ...options.headers };
        headers["Authorization"] = `Bearer ${token}`;

        if (
          options.body &&
          !(options.body instanceof FormData) && // Don't set for FormData, browser does it
          (options.method === "POST" ||
            options.method === "PUT" ||
            options.method === "PATCH")
        ) {
          headers["Content-Type"] = "application/json";
        }

        try {
          const response = await fetch(url, { ...options, headers });
          if (response.status === 401 || response.status === 403) {
            console.error(
              `User Page: Authorization error (${response.status}) for ${url}.`
            );
            window.showNotification("Access Denied", "error", 5000);
            setTimeout(() => {
              window.location.href = "/userpage.html";
            }, 500);

            throw new Error(`Authorization failed (${response.status})`);
          }
          return response;
        } catch (networkError) {
          console.error(
            "User Page: Network or Auth error during secureFetch:",
            networkError
          );
          if (!networkError.message.includes("Authorization failed")) {
            // Avoid double notification
            window.showNotification(
              `Network Error: ${networkError.message}. Check connection or server status.`,
              "error",
              7000
            );
          }
          throw networkError; // Re-throw to be caught by calling function
        }
      }
      // --- End Authentication & Authorization ---

      // --- Initial Data Loading (Parallel) ---
      async function fetchRoles() {
        try {
          const response = await secureFetch(`${BASE_API_URL}/api/auth`, {
            method: "POST", // Assuming this endpoint verifies the token and returns roles
          });
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({
              detail: `Roles/Auth verification failed (Status: ${response.status})`,
            }));
            throw new Error(errorData.detail);
          }
          const userData = await response.json();
          if (
            !userData ||
            (userData.isUser !== true && userData.isAdmin !== true) // Check for basic user/admin flag
          ) {
            console.warn(
              "User Page: User does not have sufficient privileges according to backend verification. Signing out."
            );
            window.showNotification(
              "Access Denied. You do not have sufficient privileges for this portal.",
              "error",
              7000
            );
            if (firebaseAuth)
              await firebaseAuth
                .signOut()
                .catch((e) =>
                  console.error("Sign out after privilege check failed", e)
                );
            throw new Error("Insufficient privileges determined by backend.");
          }
          currentUserRoles = userData.roles || []; 
          return userData; // Return full user data if needed elsewhere
        } catch (error) {
          console.error("User Page: Error in fetchRoles:", error.message);
          if (firebaseAuth)
            // Attempt signout if role fetch fails critically
            await firebaseAuth
              .signOut()
              .catch((e) =>
                console.error("Sign out after fetchRoles error failed", e)
              );
          throw error; // Re-throw for loadInitialDataConcurrently to handle
        }
      }

      async function fetchTreeDataOnly() {
        if (loadingPlaceholder && !isSearchViewActive) {
          // Show loading only if not already in search
          loadingPlaceholder.innerHTML =
            '<p class="p-4 text-lg text-[var(--text-secondary)]">Loading knowledge base structure...</p>';
          loadingPlaceholder.style.display = "flex";
        }

        try {
          const res = await secureFetch(`${BASE_API_URL}/api/tree`);
          if (!res.ok) {
            const errorText = await res.text(); // Get raw error text for better debugging
            throw new Error(
              `Failed to load knowledge base (HTTP ${res.status}): ${
                errorText || "Server error"
              }`
            );
          }
          const data = await res.json();
          if (!Array.isArray(data)) {
            console.error(
              "User Page: Fetched tree data is not an array:",
              data
            );
            throw new Error("Received invalid tree structure from server.");
          }
          fullTreeData = data;
        } catch (error) {
          console.error("User Page: Failed to fetch full tree:", error);
          fullTreeData = []; // Reset tree data on error
          throw error; // Re-throw for loadInitialDataConcurrently
        }
      }

      async function loadInitialDataConcurrently() {
        if (loadingPlaceholder) {
          loadingPlaceholder.innerHTML =
            '<p class="p-4 text-lg text-[var(--text-secondary)]">Initializing knowledge base...</p>';
          loadingPlaceholder.style.display = "flex";
        }
        isSearchViewActive = false; // Reset search view on full load

        try {
          await fetchRoles(); // Ensure roles are fetched first or in parallel if independent
          await fetchTreeDataOnly(); // Then fetch tree data
          navigateToFolder(null); // Navigate to root after data is loaded
        } catch (error) {
          console.error(
            "User Page: Error during initial data load sequence:",
            error
          );
          if (window.showNotification)
            window.showNotification(
              `Could not load page data: ${
                error.message || "Unknown error"
              }. Please try logging in again.`,
              "error",
              10000
            );
          if (folderContentContainer) {
            // Display error in main content area
            folderContentContainer.innerHTML = `<p class="text-[var(--text-red-accent)] p-4 text-center">Critical error loading page data. <br>Details: ${error.message}. <br>Please try refreshing. If the issue persists, you might need to log in again or contact support.</p>`;
          }
        } finally {
          if (loadingPlaceholder) loadingPlaceholder.style.display = "none";
        }
      }
      // --- End Initial Data Loading ---

      // --- Permissions ---
      function canPerformAction(nodeId, allowedRoles) {
        if (nodeId === null || typeof nodeId === "undefined") {
          // Cannot perform action on root via this check directly
          return false;
        }
        const roleEntry = currentUserRoles.find(
          (r) => String(r.nodeId) === String(nodeId)
        );
        return !!(roleEntry && allowedRoles.includes(roleEntry.role));
      }
      function canAddContentToNode(nodeId) {
        return canPerformAction(String(nodeId), ["ADMIN", "EDITOR"]);
      }
      function canDeleteNode(nodeId) {
        // Add additional checks here if needed, e.g., cannot delete root, etc.
        return canPerformAction(String(nodeId), ["ADMIN"]);
      }
      function canEditArtifactsInNode(parentNodeId) {
        // This checks permission on the parent node for actions on its artifacts
        return canPerformAction(String(parentNodeId), ["ADMIN", "EDITOR"]);
      }
      // --- End Permissions ---

      // --- Navigation and Rendering ---
      function findNodeInTree(nodeId, nodesToSearch = fullTreeData) {
        if (
          nodeId === null ||
          typeof nodeId === "undefined" ||
          nodeId === "null"
        ) {
          return {
            id: null,
            name: "Knowledge Base",
            children: nodesToSearch,
            artifacts: [], // Root usually doesn't have direct artifacts in this model
            type: "ROOT",
            description:
              "Welcome to the Knowledge Base. Browse categories below or use the search.", // Optional root description
          };
        }
        for (const node of nodesToSearch) {
          if (String(node.id) === String(nodeId)) return node;
          if (node.children && Array.isArray(node.children)) {
            const found = findNodeInTree(nodeId, node.children);
            if (found) return found;
          }
        }
        return null; // Node not found
      }

      function buildPathSegmentsRecursive(
        targetNodeId,
        nodesToSearch,
        currentStack
      ) {
        for (const node of nodesToSearch) {
          const nodePathSegment = { id: node.id, name: node.name };
          if (String(node.id) === String(targetNodeId)) {
            return [...currentStack, nodePathSegment];
          }
          if (node.children && Array.isArray(node.children)) {
            const foundPath = buildPathSegmentsRecursive(
              targetNodeId,
              node.children,
              [...currentStack, nodePathSegment]
            );
            if (foundPath) return foundPath;
          }
        }
        return null;
      }

      function renderBreadcrumbs() {
        if (!breadcrumbContainer) return;
        breadcrumbContainer.innerHTML = "";
        if (!currentPath || currentPath.length === 0) {
          // Default to root if path is somehow empty
          currentPath = [{ id: null, name: "Knowledge Base" }];
        }
        currentPath.forEach((segment, index) => {
          const segEl = document.createElement("span");
          if (index < currentPath.length - 1) {
            const link = document.createElement("a");
            link.textContent = segment.name;
            link.href = "#"; // Prevent page reload
            link.classList.add("breadcrumb-item");
            link.onclick = (e) => {
              e.preventDefault();
              if (!isSearchViewActive) navigateToFolder(segment.id);
              else {
                // If in search view, clicking breadcrumb should exit search
                isSearchViewActive = false;
                if (searchInputElement) searchInputElement.value = "";
                navigateToFolder(segment.id);
              }
            };
            segEl.appendChild(link);
            breadcrumbContainer.appendChild(segEl);

            const separator = document.createElement("span");
            separator.classList.add("breadcrumb-separator");
            separator.innerHTML = "&gt;"; // HTML entity for ">"
            breadcrumbContainer.appendChild(separator);
          } else {
            // Current page in breadcrumb
            segEl.textContent = segment.name;
            segEl.classList.add("breadcrumb-current");
            breadcrumbContainer.appendChild(segEl);
          }
        });
      }

      async function navigateToFolder(nodeId) {
        // Clear any existing folder overview first
        const existingOverview = document.getElementById(
          "current-folder-overview-container"
        );
        if (existingOverview) {
          existingOverview.remove();
        }

        currentViewNodeId =
          nodeId === undefined || nodeId === null || nodeId === "null"
            ? null
            : String(nodeId);

        if (!isSearchViewActive && searchInputElement)
          // Clear search if navigating normally
          searchInputElement.value = "";

        let newPath;
        if (currentViewNodeId === null) {
          // Root
          newPath = [{ id: null, name: "Knowledge Base" }];
        } else {
          const pathSegments = buildPathSegmentsRecursive(
            currentViewNodeId,
            fullTreeData,
            [] // Initial stack for recursion
          );
          if (pathSegments && pathSegments.length > 0) {
            newPath = [{ id: null, name: "Knowledge Base" }, ...pathSegments]; // Prepend root
          } else {
            // Fallback if node ID not found in tree (e.g., after a deletion)
            console.warn(
              `User Page: Node ID ${currentViewNodeId} not found for path. Navigating to root.`
            );
            newPath = [{ id: null, name: "Knowledge Base" }];
            currentViewNodeId = null; // Reset to root
          }
        }
        currentPath = newPath;
        const currentFolderObject = findNodeInTree(
          currentViewNodeId,
          fullTreeData
        );

        displayCurrentFolderOverview(currentFolderObject); // Display overview for the current folder

        renderBreadcrumbs();
        if (!isSearchViewActive) {
          renderFolderContents(); // Render sub-folders and artifacts
          if (currentViewNodeId !== null) {
            // Display graph only if not at root
            await displayNodeGraph(currentViewNodeId);
          } else {
            hideNodeGraph(); // Hide graph if at root
          }
        } else {
          hideNodeGraph(); // Hide graph if in search view
        }

        if (currentFolderNameEl)
          currentFolderNameEl.textContent = currentFolderObject
            ? currentFolderObject.name
            : "Knowledge Base"; // Fallback name

        if (backButton) {
          if (currentPath.length > 1 && !isSearchViewActive) {
            // Show back if not at root and not in search
            backButton.style.display = "inline-flex";
            backButton.onclick = () => {
              if (currentPath.length > 1) {
                // Should always be true if button is visible
                const parentSegment = currentPath[currentPath.length - 2];
                navigateToFolder(parentSegment.id);
              }
            };
          } else {
            backButton.style.display = "none";
          }
        }

        if (addItemToFolderBtn) {
          const nodeIdForPermissionCheck =
            currentViewNodeId === null ? null : String(currentViewNodeId); // Use string for permission check
          if (
            nodeIdForPermissionCheck !== null && // Can't add to root via this button
            canAddContentToNode(nodeIdForPermissionCheck) &&
            !isSearchViewActive // Don't show add button in search view
          ) {
            addItemToFolderBtn.style.display = "inline-flex";
            addItemToFolderBtn.onclick = () => toggleAddItemForm(true);
          } else {
            addItemToFolderBtn.style.display = "none";
            toggleAddItemForm(false); // Ensure form is hidden if button is hidden
          }
        }
      }

      function renderFolderContents() {
        if (!folderContentContainer) return;
        folderContentContainer.innerHTML = ""; // Clear previous contents

        const nodeToDisplay = findNodeInTree(currentViewNodeId, fullTreeData);

        if (loadingPlaceholder) loadingPlaceholder.style.display = "flex"; // Show loading temporarily

        if (!nodeToDisplay) {
          folderContentContainer.innerHTML =
            '<p class="p-4 text-[var(--text-tertiary)] text-center">Folder not found or you may not have access to it.</p>';
          if (loadingPlaceholder) loadingPlaceholder.style.display = "none";
          return;
        }

        const itemsToShow = [];
        if (nodeToDisplay.children && Array.isArray(nodeToDisplay.children)) {
          itemsToShow.push(
            ...nodeToDisplay.children.map((c) => ({
              ...c,
              itemType: "folder",
              parentIdActual: String(nodeToDisplay.id === null ? "null" : nodeToDisplay.id),
            }))
          );
        }
        if (nodeToDisplay.artifacts && Array.isArray(nodeToDisplay.artifacts)) {
          itemsToShow.push(
            ...nodeToDisplay.artifacts.map((a) => ({
              ...a, // This should include createdAt, updatedAt, creator for artifacts from backend
              itemType: "artifact", // Explicitly set for clarity
              parentIdActual: String(nodeToDisplay.id === null ? "null" : nodeToDisplay.id),
            }))
          );
        }

        itemsToShow.sort(customSortItems); // Apply custom sorting

        // All items are cards, remove list-view-only specific logic that changes display mode
        folderContentContainer.classList.remove("list-view-only");
        folderContentContainer.style.display = "grid"; // Ensure grid display for cards

        if (itemsToShow.length === 0) {
          folderContentContainer.innerHTML =
            '<p class="p-4 text-lg text-[var(--text-tertiary)] text-center">This folder is empty.</p>';
        } else {
          itemsToShow.forEach((item) => {
            const itemName = escapeJSString(item.name || item.title); // Use name for folder, title for artifact
            const parentIdForPerms = String(item.parentIdActual === null || item.parentIdActual === "null" ? null : item.parentIdActual);

            const card = document.createElement("div");
            card.classList.add("item-card"); // Use item-card for both folders and files
            card.dataset.itemId = String(item.id);
            card.dataset.itemType = item.itemType;

            let iconSVG, itemTypeDisplay, itemDescriptionHTML, actionsDivContent = "";
            let iconColorClass = "";

            if (item.itemType === "folder") {
              iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" /></svg>`;
              itemTypeDisplay = "Folder";
                iconColorClass = "text-[var(--text-yellow-accent)]";

              if (item.description && typeof item.description === "string" && item.description.trim() !== "") {
                itemDescriptionHTML = `<div class="item-card-description">${escapeJSString(item.description).replace(/\n/g, "<br>")}</div>`;
              } else {
                itemDescriptionHTML = `<div class="item-card-description"><em>No description provided.</em></div>`;
              }

              if (canDeleteNode(String(item.id)) && String(item.id) !== "null" && parentIdForPerms !== "null") {
                actionsDivContent += `<button title="Delete folder" class="action-icon-btn delete" onclick="event.stopPropagation(); deleteNode('${String(item.id)}')"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>`;
              }
              card.onclick = () => navigateToFolder(item.id);

            } else { // Artifact (File)
              iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>`;
              itemTypeDisplay = item.type || "File"; // Use artifact's specific type if available, fallback to "File"
                    iconColorClass = "text-[var(--text-blue-accent)]";


              if (item.description && typeof item.description === "string" && item.description.trim() !== "") {
                itemDescriptionHTML = `<div class="item-card-description">${escapeJSString(item.description).replace(/\n/g, "<br>")}</div>`;
              } else {
                itemDescriptionHTML = `<div class="item-card-description"><em>No description provided.</em></div>`;
              }

              // Actions for artifact card
                    // parentIdForPerms here refers to the artifact's parent folder ID
              if (canEditArtifactsInNode(parentIdForPerms)) {
                actionsDivContent += `<button title="Delete file" class="action-icon-btn delete" onclick="event.stopPropagation(); deleteArtifact('${String(item.id)}', '${parentIdForPerms}')"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>`;
              }
                    // Direct link action icon
                    if (item.link && item.link !== "#") {
                        let processedLink = item.link;
                         if (!processedLink.startsWith("http://") && !processedLink.startsWith("https://")) {
                            processedLink = `https://${processedLink}`;
                        }
                        actionsDivContent += `<a href="${processedLink}" target="_blank" rel="noopener noreferrer" title="Open Resource: ${escapeJSString(item.link)}" class="action-icon-btn" onclick="event.stopPropagation();"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M12.586 2.586a2 2 0 012.828 0L18 5.172a2 2 0 010 2.828l-7.414 7.414a2 2 0 01-2.828 0L5.172 13a2 2 0 010-2.828l2.586-2.586a2 2 0 012.828 0L12 8.586l1.414-1.414L12.586 2.586zM10 5a1 1 0 00-1 1v.01L9 6a1 1 0 00-1 1v.01L8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V9.01l.01-.01A1 1 0 0013 8l.01-.01A1 1 0 0014 7l.01-.01A1 1 0 0015 6l-.01-.01A1 1 0 0014 5h-4z" clip-rule="evenodd" /></svg></a>`;
                    }
              // Main card click opens modal for artifacts
              card.onclick = () => showArtifactDetailsModal(
                  item.title,
                  item.description,
                  item.link,
                  item.createdAt, // pass new data
                  item.updatedAt, // pass new data
                  item.creator    // pass new data
              );
            }

            card.innerHTML = `
                <div>
                    <div class="item-card-icon-wrapper">
                        <span class="item-card-icon ${iconColorClass}">${iconSVG}</span>
                    </div>
                    <h3 class="item-card-name">${itemName}</h3>
                    <p class="item-card-type">${itemTypeDisplay}</p>
                    ${itemDescriptionHTML}
                </div>
                ${actionsDivContent ? `<div class="item-card-actions">${actionsDivContent}</div>` : ""}
            `;
            folderContentContainer.appendChild(card);
          });
        }
        if (loadingPlaceholder) loadingPlaceholder.style.display = "none"; // Hide loading after rendering
      }
      // --- End Navigation and Rendering ---

 // --- Node Graph Visualization ---
    async function displayNodeGraph(nodeId) {
        const graphSection = document.getElementById("node-graph-section");
        const graphContainer = document.getElementById("node-graph-visualization");
        const graphLoadingPlaceholder = document.getElementById("node-graph-loading");
        const graphErrorPlaceholder = document.getElementById("node-graph-error");
        const graphControls = document.getElementById("node-graph-controls"); // Get controls div

        if (!graphSection || !graphContainer || !graphLoadingPlaceholder || !graphErrorPlaceholder || !graphControls) {
            console.error("Graph display or control elements not found.");
            return;
        }

        graphErrorPlaceholder.style.display = "none";
        graphContainer.innerHTML = "";
        graphLoadingPlaceholder.style.display = "flex";
        graphSection.style.display = "block";
        graphControls.style.display = "flex"; // Show graph controls

        try {
            const response = await secureFetch(
                `${BASE_API_URL}/api/nodes/${nodeId}/graph`
            );
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({
                    detail: `Failed to load graph (Status: ${response.status})`,
                }));
                throw new Error(errorData.detail);
            }
            const rawApiGraphData = await response.json();

            if (!rawApiGraphData || typeof rawApiGraphData.id === "undefined") {
                graphErrorPlaceholder.textContent = "No graph data available for this node or the folder is empty.";
                graphErrorPlaceholder.style.display = "block";
                graphLoadingPlaceholder.style.display = "none";
                graphContainer.innerHTML = "";
                // Keep controls visible even if there's no graph data, or hide them:
                // graphControls.style.display = "none";
                return;
            }
            renderD3TreeGraph(rawApiGraphData, graphContainer, String(nodeId));
            graphLoadingPlaceholder.style.display = "none";
        } catch (error) {
            console.error("Error fetching or rendering node graph:", error);
            graphErrorPlaceholder.textContent = `Error loading graph: ${error.message}`;
            graphErrorPlaceholder.style.display = "block";
            graphLoadingPlaceholder.style.display = "none";
            graphContainer.innerHTML = "";
            // graphControls.style.display = "none"; // Optionally hide controls on error
        }
    }

    function hideNodeGraph() {
        const graphSection = document.getElementById("node-graph-section");
        if (graphSection) graphSection.style.display = "none";
        const graphContainer = document.getElementById("node-graph-visualization");
        if (graphContainer) graphContainer.innerHTML = "";
        const graphControls = document.getElementById("node-graph-controls"); // Get controls div
        if (graphControls) graphControls.style.display = "none"; // Hide graph controls
    }

    function renderD3TreeGraph(
        apiNodeData,
        containerElement,
        centerNodeOriginalIdStr
    ) {
        containerElement.innerHTML = ""; 
        const centerNodeOriginalId = parseInt(centerNodeOriginalIdStr);

        const containerRect = containerElement.getBoundingClientRect();
        const width = containerRect.width || 800;
        const height = containerRect.height || 500;

        const svg = d3
            .select(containerElement)
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", `0 0 ${width} ${height}`)
            .attr("preserveAspectRatio", "xMidYMid meet");

        const mainGroup = svg.append("g");

        const getChildren = (d) => {
            // ... (existing getChildren logic remains the same)
            let combinedChildren = [];
            if (d.children && Array.isArray(d.children)) {
                combinedChildren = combinedChildren.concat(
                    d.children.map((child) => ({ ...child }))
                );
            }
            if (d.artifacts && Array.isArray(d.artifacts)) {
                const mappedArtifacts = d.artifacts.map((artifact) => ({
                    ...artifact,
                    name: artifact.title, 
                    type: artifact.type || "FILE", 
                    children: [], 
                }));
                combinedChildren = combinedChildren.concat(mappedArtifacts);
            }
            return combinedChildren.length ? combinedChildren : null;
        };

        const root = d3.hierarchy(apiNodeData, getChildren);

        root.each((d) => {
            const type = d.data.type || "UNKNOWN";
            d.data.displayType = type === "FILE" || type === "ARTIFACT" ? "ARTIFACT" : "FOLDER";
        });

        const nodeHeight = 35;
        const nodeWidth = 200;
        const treeLayout = d3.tree().nodeSize([nodeHeight, nodeWidth]);
        treeLayout(root);

        let x0 = Infinity;
        let x1 = -Infinity;
        root.each((d) => {
            if (d.x < x0) x0 = d.x;
            if (d.x > x1) x1 = d.x;
        });

        const initialX = 50;
        const initialY = height / 2 - root.x;

        const initialTransform = d3.zoomIdentity
            .translate(initialX, initialY)
            .scale(0.9);

        mainGroup
            .append("g")
            .attr("class", "graph-links")
            // ... (existing link drawing logic remains the same)
            .selectAll("path")
            .data(root.links())
            .join("path")
            .attr("class", "graph-link")
            .attr(
                "d",
                d3.linkHorizontal().x((d) => d.y).y((d) => d.x)
            );

        const node = mainGroup
            .append("g")
            .attr("class", "graph-nodes")
            // ... (existing node drawing logic remains the same)
            .selectAll("g")
            .data(root.descendants())
            .join("g")
            .attr(
                "class",
                (d) => `graph-node ${ d.data.id === centerNodeOriginalId && d.data.displayType === "FOLDER" ? "is-center" : "" }`
            )
            .attr("transform", (d) => `translate(${d.y},${d.x})`);

        node.append("circle")
            // ... (existing circle attributes remain the same)
             .attr("r", (d) => d.data.id === centerNodeOriginalId && d.data.displayType === "FOLDER" ? 10 : d.data.displayType === "FOLDER" ? 8 : 6)
            .attr("fill", (d) => {
                if (d.data.id === centerNodeOriginalId && d.data.displayType === "FOLDER") return "var(--text-link-hover)";
                if (d.data.displayType === "FOLDER") return "var(--text-yellow-accent)";
                if (d.data.displayType === "ARTIFACT") return "var(--text-green-accent)";
                return "var(--text-secondary)";
            })
            .attr("stroke", (d) => d.data.id === centerNodeOriginalId && d.data.displayType === "FOLDER" ? "var(--text-link)" : "var(--border-card)");


        node.append("text")
            // ... (existing text attributes remain the same)
            .attr("dy", "0.31em")
            .attr("x", (d) => {
                const effectiveChildren = getChildren(d.data);
                return effectiveChildren && effectiveChildren.length > 0 ? -12 : 12;
            })
            .attr("text-anchor", (d) => {
                const effectiveChildren = getChildren(d.data);
                return effectiveChildren && effectiveChildren.length > 0 ? "end" : "start";
            })
            .text((d) => d.data.name)
            .clone(true)
            .lower()
            .attr("stroke-linejoin", "round")
            .attr("stroke-width", 3)
            .attr("stroke", "var(--bg-primary)");

        node.append("title")
            .text( (d) => `${d.data.displayType}: ${d.data.name}\nID: ${d.data.id}\nDescription: ${d.data.description || "N/A"}`);

        // Setup zoom and pan behavior
        const zoomBehavior = d3 // Renamed for clarity to zoomBehavior
            .zoom()
            .scaleExtent([0.1, 5])
            .on("zoom", (event) => {
                mainGroup.attr("transform", event.transform);
            });

        svg.call(zoomBehavior).call(zoomBehavior.transform, initialTransform);

        // --- NEW: Add event listeners for zoom buttons ---
        const zoomInButton = document.getElementById('zoom-in-btn');
        const zoomOutButton = document.getElementById('zoom-out-btn');
        const zoomFactor = 1.2;

        if (zoomInButton) {
            zoomInButton.onclick = () => {
                svg.transition().duration(250).call(zoomBehavior.scaleBy, zoomFactor);
            };
        }
        if (zoomOutButton) {
            zoomOutButton.onclick = () => {
                svg.transition().duration(250).call(zoomBehavior.scaleBy, 1 / zoomFactor);
            };
        }
        // --- End NEW ---
    }
    // --- End Node Graph Visualization ---

      // --- Current Folder Overview Display ---
       function displayCurrentFolderOverview(folderObject) {
        const OVERVIEW_CONTAINER_ID = "current-folder-overview-container";
        const existingOverview = document.getElementById(OVERVIEW_CONTAINER_ID);
        if (existingOverview) {
          existingOverview.remove(); // Clear previous overview
        }

        // Only display if the folderObject exists
        if (folderObject) {
          const overviewContainer = document.createElement("div");
          overviewContainer.id = OVERVIEW_CONTAINER_ID;
          // Styles are applied via CSS using the ID (as per existing structure)

          let descriptionContent = "<em>No description provided.</em>";
          if (folderObject.description && typeof folderObject.description === "string" && folderObject.description.trim() !== "") {
              descriptionContent = escapeJSString(folderObject.description).replace(/\n/g, "<br>");
          }

          let detailsHtml = `<p class="readme-text">${descriptionContent}</p>`;
          let metadataHtml = '<div style="margin-top: 1rem; font-size: 0.8rem; color: var(--text-tertiary); line-height: 1.5;">';

        // Only show metadata if it's a specific folder, not the root "Knowledge Base" view
          if (folderObject.id !== null) {
            if (folderObject.creator) {
                metadataHtml += `<div><strong>Created by:</strong> ${escapeJSString(folderObject.creator)}</div>`;
            }
            if (folderObject.createdAt) {
                metadataHtml += `<div><strong>Created at:</strong> ${formatDateForDisplay(folderObject.createdAt)}</div>`;
            }

            // Calculate and display updatedAt for folders
            // folderObject here is the node from findNodeInTree, which has children and artifacts directly if it's not a leaf
            const calculatedUpdatedAt = getCalculatedFolderUpdatedAt(folderObject);
            if (calculatedUpdatedAt) {
                metadataHtml += `<div><strong>Last updated:</strong> ${formatDateForDisplay(calculatedUpdatedAt)}</div>`;
            } else {
                 metadataHtml += `<div><strong>Last updated:</strong> N/A</div>`;
            }
          }
          metadataHtml += '</div>';

        overviewContainer.innerHTML = detailsHtml + (folderObject.id !== null ? metadataHtml : '');


          const currentFolderHeader = document.getElementById("current-folder-header");
          if (currentFolderHeader && currentFolderHeader.parentNode) {
            // Insert the overview container AFTER the current-folder-header div
            currentFolderHeader.parentNode.insertBefore(
              overviewContainer,
              currentFolderHeader.nextSibling
            );
          } else {
            console.warn("Could not find current-folder-header to insert overview.");
          }
        }
      }
      // --- End Current Folder Overview Display ---

      function customSortItems(a, b) {
        const aIsFolder = a.itemType === "folder";
        const bIsFolder = b.itemType === "folder";

        // Folders first
        if (aIsFolder && !bIsFolder) return -1;
        if (!aIsFolder && bIsFolder) return 1;

        // Then sort by name (or title for artifacts)
        const nameA = (a.name || a.title || "").toString();
        const nameB = (b.name || b.title || "").toString();

        // Simple numeric prefix sort (e.g., "1. Topic", "10. Another Topic")
        const numRegex = /^(\d+)/;
        const matchA = nameA.match(numRegex);
        const matchB = nameB.match(numRegex);

        const numA = matchA ? parseInt(matchA[1], 10) : null;
        const numB = matchB ? parseInt(matchB[1], 10) : null;

        if (numA !== null && numB !== null) {
          // Both have numeric prefixes
          if (numA !== numB) return numA - numB;
          // If numbers are the same, sort by the rest of the string
          const restA = nameA.substring(matchA[1].length).trim().toLowerCase();
          const restB = nameB.substring(matchB[1].length).trim().toLowerCase();
          return restA.localeCompare(restB);
        }
        if (numA !== null && numB === null) return -1; // Items with num prefix first
        if (numA === null && numB !== null) return 1;

        // Default: alphabetical sort
        return nameA.toLowerCase().localeCompare(nameB.toLowerCase());
      }

      // --- Inline Add Item Form Logic ---
      function toggleAddItemForm(show) {
        if (
          show &&
          currentViewNodeId !== null &&
          String(currentViewNodeId) !== "null" // Ensure it's not the conceptual root
        ) {
          populateAddItemForm();
          if (addItemFormContainer)
            addItemFormContainer.style.display = "block";
          if (document.getElementById("addItemName"))
            // Focus on the first input
            document.getElementById("addItemName").focus();
        } else {
          if (addItemFormContainer) addItemFormContainer.style.display = "none";
        }
      }
      function populateAddItemForm() {
        const parentId = currentViewNodeId;
        // Prevent adding to the absolute root if 'null' represents it and it's disallowed
        if (parentId === null || String(parentId) === "null") {
          if (addItemFormContainer)
            addItemFormContainer.innerHTML =
              '<p class="text-[var(--text-tertiary)]">Adding items to the main Knowledge Base root is not supported here. Please select or create a folder.</p>';
          return;
        }
        const currentFolder = findNodeInTree(String(parentId), fullTreeData);
        const currentFolderName = currentFolder
          ? currentFolder.name
          : "Selected Folder";

        if (addItemFormContainer)
          addItemFormContainer.innerHTML = `
            <h3 class="text-xl font-semibold mb-4 text-[var(--text-primary)]">Add to '${escapeJSString(
              currentFolderName
            )}'</h3>
            <form onsubmit="event.preventDefault(); submitAddItemForm(this.querySelector('button[type=submit]'))">
                <input type="hidden" id="addItemParentId" value="${parentId}">
                <div class="mb-4"><label for="addItemName" class="label-text">Name (Folder/File)</label><input type="text" id="addItemName" class="input-field text-sm" required></div>
                <div class="mb-4"><label for="addItemType" class="label-text">Type</label><select id="addItemType" class="input-field text-sm" onchange="toggleAddItemFileOptions()"><option value="SUBFOLDER">Subfolder</option><option value="FILE">File</option></select></div>
                <div class="mb-4"><label for="addItemDescription" class="label-text">Description (Optional)</label><textarea id="addItemDescription" class="input-field text-sm" rows="2"></textarea></div>
                <div id="addItemFileMethodOptions" style="display:none;" class="mt-2 mb-4">
                    <div><label for="addItemFileSource" class="label-text text-xs">File Source:</label><select id="addItemFileSource" class="input-field text-xs py-1" onchange="toggleAddItemLinkOrUpload()"><option value="link">Enter Link</option><option value="upload">Upload File</option></select></div>
                    <div id="addItemLinkInputContainer" class="mt-2"><input type="url" placeholder="Link (e.g., https://...)" id="addItemLink" class="input-field text-sm"></div>
                    <div id="addItemUploadInputContainer" style="display:none;" class="mt-2"><input type="file" id="addItemFileUpload" class="input-field text-sm p-2"></div>
                </div>
                <div class="mt-6 flex items-center gap-3">
                    <button type="submit" class="submit-button primary">
                        <span class="button-text">Add Item</span>
                    </button>
                    <button type="button" class="submit-button secondary" onclick="toggleAddItemForm(false)">
                        <span class="button-text">Cancel</span>
                    </button>
                </div>
            </form>`;
        toggleAddItemFileOptions(); // Initialize based on default selection
      }
      function toggleAddItemFileOptions() {
        const typeSelect = document.getElementById("addItemType");
        const fileMethodOptionsDiv = document.getElementById(
          "addItemFileMethodOptions"
        );
        if (!typeSelect || !fileMethodOptionsDiv) return;

        if (typeSelect.value === "FILE") {
          fileMethodOptionsDiv.style.display = "block";
          const fileSourceSelect = document.getElementById("addItemFileSource");
          if (fileSourceSelect) fileSourceSelect.value = "link"; // Default to link
          toggleAddItemLinkOrUpload();
        } else {
          fileMethodOptionsDiv.style.display = "none";
        }
      }
      function toggleAddItemLinkOrUpload() {
        const fileSourceSelect = document.getElementById("addItemFileSource");
        const linkContainer = document.getElementById(
          "addItemLinkInputContainer"
        );
        const uploadContainer = document.getElementById(
          "addItemUploadInputContainer"
        );
        if (!fileSourceSelect || !linkContainer || !uploadContainer) return;

        const fileSource = fileSourceSelect.value;
        linkContainer.style.display = fileSource === "link" ? "block" : "none";
        uploadContainer.style.display =
          fileSource === "upload" ? "block" : "none";
        // Clear the other input when switching
        if (
          fileSource === "link" &&
          document.getElementById("addItemFileUpload")
        )
          document.getElementById("addItemFileUpload").value = "";
        if (fileSource === "upload" && document.getElementById("addItemLink"))
          document.getElementById("addItemLink").value = "";
      }

      async function submitAddItemForm(buttonElement) {
        const parentIdValue = document.getElementById("addItemParentId").value;
        const parentId =
          parentIdValue === "null" ||
          parentIdValue === null ||
          parentIdValue === ""
            ? null
            : parseInt(parentIdValue);

        const name = document.getElementById("addItemName").value.trim();
        const type = document.getElementById("addItemType").value;
        const description = document
          .getElementById("addItemDescription")
          .value.trim();

        const originalButtonText =
          buttonElement.querySelector(".button-text")?.textContent ||
          buttonElement.textContent;
        window.setButtonLoading(buttonElement, true, originalButtonText);

        if (!name) {
          window.showNotification("Name is required.", "error");
          window.setButtonLoading(buttonElement, false, originalButtonText);
          document.getElementById("addItemName")?.focus();
          return;
        }
        if (parentId === null) {
          // Should be caught by populateAddItemForm, but good safeguard
          window.showNotification(
            "Cannot add item: A valid parent folder must be selected.",
            "error"
          );
          window.setButtonLoading(buttonElement, false, originalButtonText);
          return;
        }

        try {
          let response;
          let endpoint;
          let options = { method: "POST" };
          let bodyPayload;

          if (type === "FILE") {
            const fileSource =
              document.getElementById("addItemFileSource").value;
            let commonPayload = { title: name, description, nodeId: parentId };

            if (fileSource === "link") {
              const link = document.getElementById("addItemLink").value.trim();
              if (!link || !link.startsWith("http"))
                throw new Error(
                  "A valid Link (starting with http/https) is required for file type 'link'."
                );
              commonPayload.link = link;
              endpoint = `${BASE_API_URL}/api/artifacts`;
              bodyPayload = JSON.stringify(commonPayload);
              options.body = bodyPayload;
            } else {
              // upload
              const fileInput = document.getElementById("addItemFileUpload");
              const file = fileInput.files[0];
              if (!file) throw new Error("Please select a file to upload.");
              const formData = new FormData();
              formData.append("file", file);
              formData.append("title", name);
              formData.append("description", description);
              formData.append("nodeId", String(parentId)); // Ensure nodeId is string for FormData
              endpoint = `${BASE_API_URL}/api/upload`;
              options.body = formData; // Content-Type will be set by browser for FormData
            }
          } else {
            // SUBFOLDER
            bodyPayload = JSON.stringify({
              name,
              type: "FOLDER", // Explicitly set type for backend
              parentId: parentId,
              description,
            });
            endpoint = `${BASE_API_URL}/api/nodes`;
            options.body = bodyPayload;
          }

          response = await secureFetch(endpoint, options);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({
              // Fallback if JSON parsing fails
              detail: `Request failed with status ${response.status}. ${response.statusText}`,
            }));
            throw new Error(
              errorData.detail ||
                `Failed to add item (Status: ${response.status})`
            );
          }
          window.showNotification("Item added successfully! ✅", "success");
          toggleAddItemForm(false); // Hide form
          const formElement = document.getElementById("addItemName")?.form;
          if (formElement) formElement.reset(); // Reset form fields
          toggleAddItemFileOptions(); // Reset file options display
          await fetchTreeDataOnly(); // Refresh tree data
          navigateToFolder(currentViewNodeId); // Re-render current folder
        } catch (error) {
          console.error("User Page: Error submitting add item form:", error);
          window.showNotification(`Error: ${error.message}`, "error", 5000);
        } finally {
          window.setButtonLoading(buttonElement, false, originalButtonText);
        }
      }
      // --- End Inline Add Item Form Logic ---

      // --- CRUD Operations (Delete) ---
      async function deleteNode(nodeId) {
        if (
          !confirm(
            "Are you sure you want to delete this folder and all its contents? This action cannot be undone."
          )
        )
          return;
        try {
          const response = await secureFetch(
            `${BASE_API_URL}/api/nodes/${nodeId}`,
            { method: "DELETE" }
          );
          if (!response.ok) {
            const errorData = await response
              .json()
              .catch(() => ({ detail: response.statusText })); // Fallback error
            throw new Error(errorData.detail || "Failed to delete folder.");
          }
          window.showNotification("Folder deleted successfully. ✅", "success");

          // Determine where to navigate after deletion
          let parentToNavigateTo = null;
          const pathIndex = currentPath.findIndex(
            (p) => String(p.id) === String(nodeId)
          );
          if (pathIndex > 0) {
            // If deleted node was in current path and not root
            parentToNavigateTo = currentPath[pathIndex - 1].id;
          } else if (String(currentViewNodeId) === String(nodeId)) {
            // If deleted node was the one being viewed
            // Navigate to its parent, or root if it was a top-level folder
            parentToNavigateTo =
              currentPath.length > 1
                ? currentPath[currentPath.length - 2].id
                : null;
          } else {
            // Fallback, stay in current view if deleted node was not directly related to current path
            parentToNavigateTo = currentViewNodeId;
          }

          await fetchTreeDataOnly(); // Refresh tree data
          navigateToFolder(parentToNavigateTo); // Navigate to appropriate folder
        } catch (error) {
          console.error("User Page: Error deleting node:", error);
          window.showNotification(`Error: ${error.message}`, "error");
        }
      }
      async function deleteArtifact(artifactId, parentNodeIdString) {
        if (
          !confirm(
            "Are you sure you want to delete this file? This action cannot be undone."
          )
        )
          return;
        try {
          const response = await secureFetch(
            `${BASE_API_URL}/api/artifacts/${artifactId}`,
            { method: "DELETE" }
          );
          if (!response.ok) {
            const errorData = await response
              .json()
              .catch(() => ({ detail: response.statusText }));
            throw new Error(errorData.detail || "Failed to delete file.");
          }
          window.showNotification("File deleted successfully. ✅", "success");
          await fetchTreeDataOnly(); // Refresh data
          navigateToFolder(currentViewNodeId); // Re-render current folder
        } catch (error) {
          console.error("User Page: Error deleting artifact:", error);
          window.showNotification(`Error: ${error.message}`, "error");
        }
      }
      // --- End CRUD Operations ---

// --- Modals & UI Toggles ---
      function showArtifactDetailsModal(title, description, link, createdAt, updatedAt, creator) { // Added new params
        const modal = document.getElementById("artifact-details-modal");
        if (!modal) return;
        const titleEl = document.getElementById("artifact-modal-title");
        const descEl = document.getElementById("artifact-details-modal-description");
        const linkEl = document.getElementById("artifact-modal-link");

        // Ensure the metadata container exists or create it dynamically
        const modalContentDiv = modal.querySelector('.modal-content');
        let metadataContainer = modalContentDiv.querySelector(".artifact-metadata-container");

        if (!metadataContainer) {
            metadataContainer = document.createElement('div');
            metadataContainer.className = 'artifact-metadata-container'; // Add class for styling
            metadataContainer.style.borderTop = '1px solid var(--border-input)';
            metadataContainer.style.marginTop = '1rem';
            metadataContainer.style.paddingTop = '1rem';
            metadataContainer.style.fontSize = '0.875rem'; // text-sm
            metadataContainer.style.color = 'var(--text-secondary)';
            metadataContainer.style.lineHeight = '1.6';


            // Find the div that currently holds the artifact-modal-link and close button to insert before it
            const buttonsDiv = modalContentDiv.querySelector('.mt-6.text-right.space-x-3');
            if (buttonsDiv) {
                 modalContentDiv.insertBefore(metadataContainer, buttonsDiv);
            } else {
                // Fallback: append if the specific layout isn't found (less ideal)
                const descriptionDiv = document.getElementById("artifact-details-modal-description");
                 if (descriptionDiv && descriptionDiv.parentElement) {
                    descriptionDiv.parentElement.appendChild(metadataContainer);
                 } else {
                    modalContentDiv.appendChild(metadataContainer);
                 }
            }
        }
        metadataContainer.innerHTML = ''; // Clear previous metadata

        if (titleEl) titleEl.textContent = title || "Artifact Details";
        if (descEl) {
          descEl.innerHTML =
            description && typeof description === "string" && description.trim() !== ""
              ? escapeJSString(description).replace(/\n/g, "<br>")
              : "<em>No description provided.</em>";
        }

        // Populate metadata
        let hasMetadata = false;
        if (creator) {
          const creatorP = document.createElement('p');
          creatorP.style.marginBottom = "0.25rem";
          creatorP.innerHTML = `<strong>Creator:</strong> ${escapeJSString(creator)}`;
          metadataContainer.appendChild(creatorP);
          hasMetadata = true;
        }
        if (createdAt) {
          const createdAtP = document.createElement('p');
          createdAtP.style.marginBottom = "0.25rem";
          createdAtP.innerHTML = `<strong>Created At:</strong> ${formatDateForDisplay(createdAt)}`;
          metadataContainer.appendChild(createdAtP);
          hasMetadata = true;
        }
        if (updatedAt) {
          const updatedAtP = document.createElement('p');
          updatedAtP.style.marginBottom = "0.25rem";
          updatedAtP.innerHTML = `<strong>Updated At:</strong> ${formatDateForDisplay(updatedAt)}`;
          metadataContainer.appendChild(updatedAtP);
          hasMetadata = true;
        }

        if (!hasMetadata) { // If no metadata, hide container or show placeholder
            metadataContainer.innerHTML = '<p><em>No metadata available.</em></p>';
        }
        metadataContainer.style.display = 'block'; // Ensure it's visible


        let processedLink = link || "#";
        if (
          // Ensure link is absolute or #
          processedLink &&
          !processedLink.startsWith("http://") &&
          !processedLink.startsWith("https://") &&
          processedLink !== "#"
        ) {
          processedLink = `https://${processedLink}`; // Default to https if protocol missing
        }
        if (linkEl) linkEl.href = processedLink;

        if (linkEl) {
          // Enable/disable link button
          if (!link || link === "#") {
            linkEl.classList.add("opacity-50", "cursor-not-allowed");
            linkEl.removeAttribute("target"); // Remove target if no link
            linkEl.onclick = (e) => e.preventDefault(); // Prevent action
            linkEl.title = "No link provided";
          } else {
            linkEl.classList.remove("opacity-50", "cursor-not-allowed");
            linkEl.setAttribute("target", "_blank"); // Open in new tab
            linkEl.onclick = null; // Restore default behavior
            linkEl.title = `Go to: ${processedLink}`;
          }
        }
        modal.classList.add("active");
      }
// ... rest of this section (closeArtifactDetailsModal, theme logic etc.)


      function closeArtifactDetailsModal() {
        const modal = document.getElementById("artifact-details-modal");
        if (modal) modal.classList.remove("active");
      }

      const themeToggleButton = document.getElementById("theme-toggle-button");
      const sunIconHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>`;
      const moonIconHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>`;

      // Ensure these point to your actual logo URLs if they are different for themes
      const USER_PAGE_LIGHT_MODE_LOGO =
        "https://niveussolutions.com/wp-content/uploads/2025/02/Niveus-ntt-data.png";
      const USER_PAGE_DARK_MODE_LOGO =
        "https://gitlab.niveussolutions.com/uploads/-/system/appearance/header_logo/1/Nivues_log.png"; // Example dark mode logo

      const userPageLogoElement = document.getElementById("user-page-logo");

      function applyTheme(theme) {
        if (!userPageLogoElement) return; // Guard if logo element not found

        if (theme === "light") {
          document.body.classList.add("light-theme");
          if (themeToggleButton) themeToggleButton.innerHTML = moonIconHTML;
          userPageLogoElement.src = USER_PAGE_LIGHT_MODE_LOGO;
          localStorage.setItem("userPageTheme", "light");
        } else {
          // Default to dark
          document.body.classList.remove("light-theme");
          if (themeToggleButton) themeToggleButton.innerHTML = sunIconHTML;
          userPageLogoElement.src = USER_PAGE_DARK_MODE_LOGO;
          localStorage.setItem("userPageTheme", "dark");
        }
      }
      if (themeToggleButton) {
        themeToggleButton.addEventListener("click", () => {
          applyTheme(
            document.body.classList.contains("light-theme") ? "dark" : "light"
          );
        });
        // Apply initial theme based on localStorage or system preference (defaulting to dark)
        applyTheme(
          localStorage.getItem("userPageTheme") ||
            (window.matchMedia("(prefers-color-scheme: dark)").matches
              ? "dark"
              : "dark") // Default to dark if no preference or local storage
        );
      }

      if (userMenuButton && userDropdownMenu) {
        userMenuButton.addEventListener("click", (event) => {
          event.stopPropagation(); // Prevent click from bubbling to document
          const isExpanded =
            userMenuButton.getAttribute("aria-expanded") === "true";
          userMenuButton.setAttribute("aria-expanded", String(!isExpanded));
          userDropdownMenu.classList.toggle("hidden");
        });
        // Close dropdown if clicked outside
        document.addEventListener("click", (event) => {
          if (
            userDropdownMenu &&
            !userDropdownMenu.classList.contains("hidden") &&
            userMenuButton &&
            !userMenuButton.contains(event.target) && // Click was not on the button
            !userDropdownMenu.contains(event.target) // Click was not inside the dropdown
          ) {
            userDropdownMenu.classList.add("hidden");
            userMenuButton.setAttribute("aria-expanded", "false");
          }
        });
      }
      if (logoutButtonDropdown && firebaseAuth) {
        logoutButtonDropdown.addEventListener("click", async () => {
          try {
            await firebaseAuth.signOut();
            sessionStorage.removeItem("userToken"); // Clear token
            window.showNotification("Logged out successfully.", "success");
            // Redirect is handled by onAuthStateChanged
          } catch (error) {
            console.error("User Page: Error signing out:", error);
            window.showNotification(
              "Logout failed. Please try again.",
              "error"
            );
          }
        });
      }
      // --- End Modals & UI Toggles ---

      // --- Search Functionality ---
      let searchResults = []; // Holds current search results

      function highlightText(text, query) {
        if (!query || typeof text !== "string")
          return escapeJSString(text || ""); // Return escaped original if no query or not string
        const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // Escape regex special chars
        const regex = new RegExp(`(${safeQuery})`, "gi"); // Case-insensitive, global
        return escapeJSString(text).replace(
          regex,
          '<span class="highlight">$1</span>' // Wrap match in highlight span
        );
      }

      const debouncedPerformGlobalSearch = debounce(performGlobalSearch, 350); // Debounce search input

      if (searchInputElement) {
        searchInputElement.addEventListener("input", (e) => {
          debouncedPerformGlobalSearch(e.target.value);
        });
      }

      function performGlobalSearch(term) {
        searchResults = []; // Clear previous results
        const searchTerm = term.trim().toLowerCase();
        if (!searchTerm) {
          // If search is cleared, revert to folder view
          isSearchViewActive = false;
          navigateToFolder(currentViewNodeId); // Re-render current folder (which will show its overview)
          return;
        }
        isSearchViewActive = true;
        hideNodeGraph(); // Hide graph in search view
        const overviewContainer = document.getElementById(
          "current-folder-overview-container"
        ); // Hide main folder overview in search
        if (overviewContainer) overviewContainer.remove();

        function recurseSearch(nodes, pathStack) {
          for (const node of nodes) {
            if (!node) continue; // Skip if node is null/undefined
            const currentItemPath = [
              ...pathStack,
              { id: node.id, name: node.name },
            ];

            let folderMatchedByName = false;
            // Match folder name
            if (node.name && node.name.toLowerCase().includes(searchTerm)) {
              searchResults.push({
                item: node,
                path: currentItemPath,
                itemType: "folder",
                matchSource: "name",
              });
              folderMatchedByName = true;
            }

            // Match folder description
            if (
              node.description &&
              typeof node.description === "string" &&
              node.description.toLowerCase().includes(searchTerm)
            ) {
              const existingEntryIndex = searchResults.findIndex(
                (sr) => sr.item.id === node.id && sr.itemType === "folder"
              );

              if (existingEntryIndex === -1) {
                // If not already added (e.g., by name match)
                searchResults.push({
                  item: node,
                  path: currentItemPath,
                  itemType: "folder",
                  matchSource: "description",
                });
              } else if (folderMatchedByName) {
                // If already added for name, update matchSource if description also matches
                if (searchResults[existingEntryIndex].matchSource === "name") {
                  searchResults[existingEntryIndex].matchSource =
                    "name, description";
                } else if (
                  !searchResults[existingEntryIndex].matchSource.includes(
                    "description"
                  )
                ) {
                  // If it was matched by something else (less likely for folder) and now description too
                  searchResults[existingEntryIndex].matchSource +=
                    ", description";
                }
              }
            }

            // Match artifacts within the folder
            if (node.artifacts && Array.isArray(node.artifacts)) {
              for (const artifact of node.artifacts) {
                if (!artifact) continue;
                let artifactAlreadyAdded = searchResults.some(
                  (
                    sr // Check if this artifact ID is already in results
                  ) => sr.item.id === artifact.id && sr.itemType === "artifact"
                );

                // Match artifact title
                if (
                  artifact.title &&
                  artifact.title.toLowerCase().includes(searchTerm) &&
                  !artifactAlreadyAdded // Add only if not already present
                ) {
                  searchResults.push({
                    item: artifact,
                    path: currentItemPath, // Path to parent folder
                    itemType: "artifact",
                    matchSource: "title",
                  });
                  artifactAlreadyAdded = true; // Mark as added to prevent duplicate from description match
                }
                // Match artifact description (only if not already added by title)
                if (
                  artifact.description &&
                  typeof artifact.description === "string" &&
                  artifact.description.toLowerCase().includes(searchTerm) &&
                  !artifactAlreadyAdded
                ) {
                  searchResults.push({
                    item: artifact,
                    path: currentItemPath,
                    itemType: "artifact",
                    matchSource: "description",
                  });
                }
              }
            }
            // Recurse into subfolders
            if (node.children && Array.isArray(node.children)) {
              recurseSearch(node.children, currentItemPath);
            }
          }
        }
        recurseSearch(fullTreeData, [{ id: null, name: "Knowledge Base" }]); // Start search from root
        renderSearchResults(searchResults, searchTerm);
      }

      function renderSearchResults(results, searchTerm = "") {
        if (!folderContentContainer) return;

        const overviewElem = document.getElementById("current-folder-overview-container");
        if (overviewElem) overviewElem.remove();

        folderContentContainer.innerHTML = "";
        toggleAddItemForm(false);
        if (backButton) backButton.style.display = "none";
        if (addItemToFolderBtn) addItemToFolderBtn.style.display = "none";

        const resultsTitle = results.length > 0 ? `Search Results for "${escapeJSString(searchTerm)}"` : `No Results for "${escapeJSString(searchTerm)}"`;
        if (currentFolderNameEl) currentFolderNameEl.textContent = resultsTitle;
        if (breadcrumbContainer) breadcrumbContainer.innerHTML = `<span class="breadcrumb-current">Search Results</span>`;

        if (results.length === 0) {
          folderContentContainer.innerHTML = `<p class="p-4 text-lg text-[var(--text-tertiary)] text-center">No items found matching your search.</p>`;
          return;
        }
        folderContentContainer.style.display = "grid"; // Ensure grid for search result cards too

        results.forEach((result) => {
          const card = document.createElement("div");
          card.classList.add("search-result-card"); // Or "item-card" if styles are fully merged

          const itemName = result.item.name || result.item.title;
          const itemTypeDisplay = result.itemType.charAt(0).toUpperCase() + result.itemType.slice(1);
          let displayPathString = result.path.map((p) => p.name).join(" > ");

          const iconClass = result.itemType === "folder" ? "text-[var(--text-yellow-accent)]" : "text-[var(--text-blue-accent)]";
          const iconSVG = result.itemType === "folder"
              ? `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" /></svg>`
              : `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>`;

          let descriptionHTML = "";
          if (result.item.description && typeof result.item.description === "string" && result.item.description.trim() !== "") {
            descriptionHTML = `<p class="search-result-description">${highlightText(result.item.description, searchTerm)}</p>`;
          } else {
            descriptionHTML = `<p class="search-result-description"><em>No description provided.</em></p>`;
          }

          card.innerHTML = `
            <div>
              <div class="item-card-icon-wrapper"><span class="search-result-icon ${iconClass}">${iconSVG}</span></div>
              <h3 class="search-result-name">${highlightText(itemName,searchTerm)}</h3>
              <p class="search-result-type">${itemTypeDisplay}</p>
              ${descriptionHTML}
              <p class="search-result-path">In: ${escapeJSString(displayPathString)}</p>
            </div>`; // Removed item-card-actions for search results to simplify, but can be added if needed

          card.onclick = () => {
            isSearchViewActive = false;
            if (searchInputElement) searchInputElement.value = "";
            if (result.itemType === "folder") {
              navigateToFolder(result.item.id);
            } else { // Artifact
              const parentFolderId = result.path.length > 1 ? result.path[result.path.length - 1].id : null;
              navigateToFolder(parentFolderId); // Navigate to parent folder
              setTimeout(() => { // Then show modal
                showArtifactDetailsModal(
                  result.item.title,
                  result.item.description,
                  result.item.link,
                  result.item.createdAt, // Pass new data
                  result.item.updatedAt, // Pass new data
                  result.item.creator    // Pass new data
                );
              }, 100); // Small delay for UI update
            }
          };
          folderContentContainer.appendChild(card);
        });
      }
      // --- End Search Functionality ---

      // --- Global Event Listeners (Escape key) ---
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          // Close artifact details modal
          const artifactModal = document.getElementById(
            "artifact-details-modal"
          );
          if (artifactModal?.classList.contains("active")) {
            closeArtifactDetailsModal();
          }
          // Close add item form
          if (addItemFormContainer?.style.display === "block") {
            toggleAddItemForm(false);
          }
          // Close user dropdown menu
          if (
            userDropdownMenu &&
            !userDropdownMenu.classList.contains("hidden")
          ) {
            userDropdownMenu.classList.add("hidden");
            if (userMenuButton)
              userMenuButton.setAttribute("aria-expanded", "false");
          }
        }
      });
      // --- End Global Event Listeners ---