const socket = io()

//elements
const $messageForm = document.querySelector('#submit')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $locationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')
const urlTemplate = document.querySelector('#url-template').innerHTML

const messageTemplate = document.querySelector('#message-template').innerHTML
const sideBarTemplate = document.querySelector('#sidebar-template').innerHTML

//options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true})

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //visible height
    const visibleHeight = $messages.offsetHeight

    // height of messages container
    const contentHeight = $messages.scrollHeight

    // how far have i scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (contentHeight - newMessageHeight-1 < scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    $messageFormButton.setAttribute('disabled', 'disabled')
    //disable
    const chatIn = e.target.elements.chatIn.value
    socket.emit('sendMessage', chatIn, (error) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()
        //enable
        if (error) {
            return console.log(error)
        }
        console.log('Message delivered')
    })
})

socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('HH:MM')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()

})

$locationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser')
    }
    $locationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, (error) => {
            if (error) {
                console.log('Error while sharing location')
            }
            $locationButton.removeAttribute('disabled')
            console.log('Location shared!')
        })
    }) 
        
    
})

socket.on('locationMessage', (message) => {
    const html = Mustache.render(urlTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('HH:MM')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users}) => {
    const html = Mustache.render(sideBarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

socket.emit('join', { username, room}, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})