(function() {
    
    function initializeData() {
        if (!localStorage.getItem("candidates")) {
            localStorage.setItem("candidates", JSON.stringify([]));
        }
        
        if (!localStorage.getItem("votingEvents")) {
            localStorage.setItem("votingEvents", JSON.stringify([]));
        }
        
        if (!localStorage.getItem("voteRecords")) {
            localStorage.setItem("voteRecords", JSON.stringify([]));
        }
        
        if (!localStorage.getItem("users")) {
            localStorage.setItem("users", JSON.stringify([]));
        }
        
        createDefaultAdmin();
        
        syncDataSources();
    }
    
    function createDefaultAdmin() {
        let users = JSON.parse(localStorage.getItem("users") || "[]");
        
        const hasAdmin = users.some(user => user.username === "admin");
        
        if (!hasAdmin) {
            const defaultAdmin = {
                id: 1,
                username: "admin",
                password: "admin123",
                createdAt: new Date().toISOString(),
                voteCount: 0,
                lastVoteDate: null,
                isAdmin: true
            };
            
            users.push(defaultAdmin);
            localStorage.setItem("users", JSON.stringify(users));
            localStorage.setItem("is_admin", "true");
            localStorage.setItem("admin_username", "admin");
        }
    }
    
    function syncDataSources() {
        const candidates = JSON.parse(localStorage.getItem("candidates") || "[]");
        const carts = JSON.parse(localStorage.getItem("carts") || "[]");
        
        if (candidates.length > 0 && 
            (carts.length === 0 || 
             JSON.stringify(candidates) !== JSON.stringify(carts))) {
            localStorage.setItem("carts", JSON.stringify(candidates));
        }
    }

    window.voteList = [];
    window.votingEvents = [];
    
    initializeData();
})();