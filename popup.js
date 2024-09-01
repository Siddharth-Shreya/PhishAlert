let checkEmails = document.getElementById('checkEmails')
let list = document.getElementById('emailList')

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    let emails = request.emails

    list.innerHTML = ""
    
    if(emails == null || emails.length === 0){
        let li = document.createElement('li')
        li.innerText = "No emails found"
        list.appendChild(li)
    }
    else{
        emails.forEach((email) => {
            let li = document.createElement('li')
            li.innerText = email
            list.appendChild(li)
        })
    }
})

checkEmails.addEventListener("click", async () => {
    let [tab] = await chrome.tabs.query({active: true, currentWindow: true})
    chrome.scripting.executeScript({
        target: {tabId: tab.id},
        func: checkEmailsFromPage,
    })
})

function checkEmailsFromPage(){
    const emailRegEx = /[\w\.=-]+@[\w\.-]+\.[\w]{2,3}/gim
    //emailRegEx is the pattern for the format of a valid email address.
    //These emails can be fed to the ML model, as well as other strings of data that can be captured from this function later.

    let emails = document.body.innerHTML.match(emailRegEx) || []

    chrome.runtime.sendMessage({emails})
    alert(emails)
}
