// import 
const mongoose = require("mongoose");
const express = require("express");
const Pusher = require("pusher");
//import cors from 'cors'
const cors = require("cors");

const mongoData = require("./mongoData.js");

// app config
const app = express()
const port = process.env.PORT || 9000

const pusher = new Pusher({
    appId: "1099656",
    key: "19af44796523330d926e",
    secret: "75026b0db8679bb5111e",
    cluster: "ap2",
    useTLS: true
  });

/*
const pusher = new Pusher({
    appId: '1091306',
    key: '411cdc565c694553c5c8',
    secret: '9048d3e47566eea975e0',
    cluster: 'us3',
    encrypted: true
});
*/

// middlewares
app.use(cors())
app.use(express.json())

// db config mongodb+srv://admin:6CSwfuwaHPSqRh4G@cluster0.93poc.mongodb.net/imessageDB?retryWrites=true&w=majority
const mongoURI = 'mongodb+srv://Admin:Sanskar%231@cluster0.ul0bt.mongodb.net/message-app?retryWrites=true&w=majority'

mongoose.connect(mongoURI, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
})

mongoose.connection.once('open', () => {
    console.log('DB Connected')

    const changeStream = mongoose.connection.collection('conversations').watch()

    changeStream.on('change', (change) => {
        if (change.operationType === 'insert') {
            pusher.trigger('chats', 'newChat', {
                'change': change
            })
        } else if (change.operationType === 'update') {
            pusher.trigger('messages', 'newMessage', {
                'change': change
            })
        } else {
            console.log('Error triggering Pusher...')
        }
    })
})

// api routes
app.get('/', (req, res) => res.status(200).send('Hello Clever Programmers! 🚀'))

app.post('/new/conversation', (req, res) => {
    const dbData = req.body

    mongoData.create(dbData, (err, data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(201).send(data)
        }
    })
})

app.post('/new/message', (req, res) => {
    mongoData.update(
        { _id: req.query.id },
        { $push: { conversation: req.body } },
        (err, data) => {
            if (err) {
                console.log('Error saving message...')
                console.log(err)

                res.status(500).send(err)
            } else {
                res.status(201).send(data)
            }
        }
    )
})

app.get('/get/conversationList', (req, res) => {
    mongoData.find((err, data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            data.sort((b, a) => {
                return a.timestamp - b.timestamp;
            });

            let conversations = []

            data.map((conversationData) => {
                const conversationInfo = {
                    id: conversationData._id,
                    name: conversationData.chatName,
                    timestamp: conversationData.conversation[0].timestamp
                }

                conversations.push(conversationInfo)
            })

            res.status(200).send(conversations)
        }
    })
})

app.get('/get/conversation', (req, res) => {
    const id = req.query.id

    mongoData.find({ _id: id }, (err, data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(200).send(data)
        }
    })
})

app.get('/get/lastMessage', (req, res) => {
    const id = req.query.id

    mongoData.find({ _id: id }, (err, data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            let convData = data[0].conversation

            convData.sort((b, a) => {
                return a.timestamp - b.timestamp;
            });

            res.status(200).send(convData[0])
        }
    })
})

// listen
app.listen(port, () => console.log(`listening on localhost:${port}`))