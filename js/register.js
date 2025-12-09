$(function(){
    $(".errorClass").each(function(){
        showError($(this));
    })

    $(".inputClass").focus(function (){
        var labelId = $(this).attr("id") + "Error"
        $("#" + labelId).text("")
        showError($("#" + labelId))
    })

    $(".inputClass").blur(function (){
        var id = $(this).attr("id")
        var funName = "validate" + id.substring(0,1).toUpperCase() + id.substring(1) + "()"
        eval(funName)
    })

    $("#submitbuttion").hover(
		function() {
			$("#submitbuttion").attr("src", "../images/regist2.jpg");
		},
		function() {
			$("#submitbuttion").attr("src", "../images/regist1.jpg");
		}
	);

    createVerifyCode()
    
    addAdminOption();
});

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

function showError(ele){
    var text = ele.text()

    if(!text)
    {
        ele.css("display", "none");
    }
    else
    {
        ele.css("display", "");
    }
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
    
    var users = JSON.parse(localStorage.getItem("users") || "[]");
    var existingUser = users.find(user => user.username === value);
    if (existingUser) {
        errorId.text("Username already exists")
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

    var reloginpassword = $("#reloginpassword");
    var reloginpasswordError = $("#reloginpasswordError")
    if(reloginpassword.val())
    {
        if(reloginpassword.val() != value)
        {
            reloginpasswordError.text("Passwords do not match!");
            showError(reloginpasswordError)
            return false
        }
        else
        {
            reloginpasswordError.text("")
            showError(reloginpasswordError)
        }
    }
    return true
}

function validateReloginpassword(){
    var id = "reloginpassword"
    var value = $("#" + id).val()

    var errorId = $("#" + id + "Error")
    if(!value|| value.trim().length == 0)
    {
        errorId.text("Confirm password cannot be empty")
        showError(errorId)
        return false
    }
    if(value != $("#loginpassword").val())
    {
        errorId.text("Passwords do not match")
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

function addAdminOption() {
    var adminHtml = `
        <tr>
            <td class="tdText">Admin Invitation Code:</td>
            <td><input type="text" name="adminCode" id="adminCode" class="inputClass" placeholder="Enter admin invitation code (optional)"/></td>
            <td><label class="errorClass" id="adminCodeError"></label></td>
        </tr>
    `;
    
    $("tr:has(#verifycode)").before(adminHtml);
    
    $("#adminCode").blur(function() {
        validateAdminCode();
    });
}

function validateAdminCode() {
    var id = "adminCode"
    var value = $("#" + id).val()
    
    var errorId = $("#" + id + "Error")
    
    if (value && value !== "ADMIN2025") {
        errorId.text("Admin invitation code incorrect")
        showError(errorId)
        return false
    }
    
    errorId.text("")
    showError(errorId)
    return true
}

function register()
{
    var id1 = "username"
    var id2 = "loginpassword"
    var id3 = "reloginpassword"
    var id5 = "verifycode"
    var id6 = "adminCode"

    var flag1 = validateUsername()
    var flag2 = validateLoginpassword()
    var flag3 = validateReloginpassword()
    var flag4 = validateVerifycode()
    var flag5 = validateAdminCode()

    if(flag1 && flag2 && flag3 && flag4 && flag5)
    {
        var username = $("#" + id1).val()
        var password = $("#" + id2).val()
        var adminCode = $("#" + id6).val()
        
        var user = {
            id: Date.now(),
            username: username,
            password: password,
            createdAt: new Date().toISOString(),
            voteCount: 0,
            lastVoteDate: null,
            isAdmin: adminCode === "ADMIN2025"
        }
        
        var users = JSON.parse(localStorage.getItem("users") || "[]")
        users.push(user)
        
        localStorage.setItem("users", JSON.stringify(users))
        
        if (user.isAdmin) {
            localStorage.setItem("is_admin", "true")
            localStorage.setItem("admin_username", username)
        }
        
        sessionStorage.setItem("vote", 10)
        sessionStorage.setItem("username", username)
        sessionStorage.setItem("user_id", user.id)
        sessionStorage.setItem("is_admin", user.isAdmin)
        
        window.location.replace("home.html")
    }
}