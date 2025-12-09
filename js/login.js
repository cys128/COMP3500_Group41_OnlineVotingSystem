$(function(){
    $(".errorClass").each(function(){
        showError($(this));
    })

    $(".inputClass").focus(function (){
        var labelId = $(this).attr("id") + "Error"
        $("#" + labelId).text("")
        showError($("#" + labelId))

        var img = $(this).attr("id") + "Img";
        if(img == "usernameImg")
        {
            $("." + img).css("background-position", "0px -48px")
        }
        else if(img == "loginpasswordImg")
        {
            $("." + img).css("background-position", "-48px -48px")
        }
    })

    $(".inputClass").blur(function (){
        var id = $(this).attr("id")
        var funName = "validate" + id.substring(0,1).toUpperCase() + id.substring(1) + "()"
        if(eval(funName))
        {
            var img = $(this).attr("id") + "Img";
            if(img == "usernameImg")
            {
                $("." + img).css("background-position", "0px 0px")
            }
            else if(img == "loginpasswordImg")
            {
                $("." + img).css("background-position", "-48px 0px")
            }
        }
    })

    createVerifyCode()
    
    createDefaultAdmin();
})

function showError(ele){
    var text = ele.text()

    if(!text)
    {
        ele.css("display", "none");
    }
    else
    {
        ele.css("display", "");

        var id = ele.attr("id").replace("Error", "")
        var img = id + "Img";
        if(img == "usernameImg")
        {
            $("." + img).css("background-position", "0px -96px")
        }
        else if(img == "loginpasswordImg")
        {
            $("." + img).css("background-position", "-48px -96px")
        }
    }
}

function createVerifyCode(){
    var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
    var randCode="";
    for(var i=0;i<4;i++){
        var randPosition = Math.floor(Math.random()*(chars.length-1));
        randCode += chars[randPosition];
    }
    document.getElementById("imgVerifyCode").innerText = randCode;
}

function changeVerifyCode()
{
    createVerifyCode()

    validateVerifycode()
}

function validateUsername(){
    var id = "username"
    var value = $("#" + id).val()

    var errorId = $("#" + id + "Error")
    if(!value || value.trim().length == 0)
    {
        errorId.text("Username cannot be empty")
        showError(errorId)
        return false
    }
    if(value.length<3 || value.length>20)
    {
        errorId.text("Username length must be 3-20")
        showError(errorId)
        return false
    }

    return true
}

function validateLoginpassword(){
    var id = "loginpassword"
    var value = $("#" + id).val()

    var errorId = $("#" + id + "Error")
    if(!value|| value.trim().length == 0)
    {
        errorId.text("Password cannot be empty")
        showError(errorId)
        return false
    }
    if(value.length<6 || value.length>30)
    {
        errorId.text("Password length must be 6-30")
        showError(errorId)
        return false
    }

    return true
}

function validateVerifycode(){
    var id = "verifycode"
    var value = $("#" + id).val()

    var errorId = $("#" + id + "Error")
    if(!value)
    {
        errorId.text("Verification code cannot be empty")
        showError(errorId)
        return false
    }
    if(value.length != 4)
    {
        errorId.text("Verification code must be 4 characters!")
        showError(errorId)
        return false
    }
    var verifyCode = $("#imgVerifyCode").text()
    if(verifyCode.toUpperCase() != value.toUpperCase())
    {
        errorId.text("Verification code incorrect")
        showError(errorId)
        return false
    }
    return true
}

function createDefaultAdmin() {
    var users = JSON.parse(localStorage.getItem("users") || "[]");
    var hasAdmin = users.some(user => user.username === "admin");
    
    if (!hasAdmin) {
        var defaultAdmin = {
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
        
        console.log("Default admin account created: admin/admin123");
    }
}

function login()
{
    var id1 = "username"
    var id2 = "loginpassword"
    var id3 = "verifycode"

    var flag1 = validateUsername()
    var flag2 = validateLoginpassword()
    var flag3 = validateVerifycode()

    if(user) {
        sessionStorage.setItem("username", username);
        sessionStorage.setItem("password", password);
        sessionStorage.setItem("user_id", user.id);

        sessionStorage.setItem("is_admin", user.isAdmin ? "true" : "false");

        window.location.replace("home.html");
    }

    if(flag1 && flag2 && flag3)
    {
        var username = $("#" + id1).val()
        var password = $("#" + id2).val()
        
        var users = JSON.parse(localStorage.getItem("users") || "[]");
        var user = users.find(u => u.username === username && u.password === password);
        
        if(user)
        {
            sessionStorage.setItem("username", username)
            sessionStorage.setItem("password", password)
            sessionStorage.setItem("user_id", user.id)
            sessionStorage.setItem("is_admin", user.isAdmin)
            
            var today = new Date().toISOString().split('T')[0];
            if (user.lastVoteDate !== today) {
                sessionStorage.setItem("vote", 10);
                user.voteCount = 0;
                user.lastVoteDate = today;
                localStorage.setItem("users", JSON.stringify(users));
            } else {
                var remainingVotes = 10 - user.voteCount;
                sessionStorage.setItem("vote", remainingVotes);
            }
            
            window.location.replace("home.html")
        }
        else
        {
            var errorId = $("#usernameError")
            errorId.text("Username or password incorrect")
            showError(errorId)
        }
    }
}