import React, { useState, useEffect, useLayoutEffect } from 'react';
import axios from 'axios';
import { Typography, TextField, Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import Navbar from '../Navbar/Navbar';
import Sidebar from '../ProfileAndToys/Sidebar';
import friendpic from './friendpic3.png';
import './FriendsList.css';

// const socket = io();

const useStyles = makeStyles(() => ({
  marginAutoContainer: {
    display: 'flex',
  },
  marginAutoItem: {
    margin: 'auto',
  },
  alignItemsAndJustifyContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'right',
  },
  pupBudzHeader: {
    color: 'white',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '15%',
    marginTop: '5%',
  },
  addFriendButton: {
    textAlign: 'left',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: '30%',
    marginTop: '5%',
    padding: '10px',
  },
}));

const FriendsList = () => {
  const classes = useStyles();
  const [currentDms, setCurrentDms] = useState({});
  const [messageText, setMessageText] = useState('');
  const [friendToSearch, setFriendToSearch] = useState('');
  const [friendsList, setFriendsList] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [users, setUsers] = useState([]);
  const [warnMessage, setWarnMessage] = useState('');

  const [messages, setMessages] = useState({});
  let user;

  const getUsers = () => {
    axios.get('/findUsers').then(({ data }) => {
      setUsers(data.map((user) => user.name));
    });
  };

  useEffect(() => {
    axios.get('/session').then(({ data }) => {
      user = data.name;
    });
  }, []);

  const friendSearchOnChange = (event) => {
    setShowSuggestions(true);
    const value = event.target.value;

    let sortedSuggestions = [];
    if (value.length > 0) {
      const regex = new RegExp(`${value}`, 'i');
      sortedSuggestions = users.sort().filter((v) => regex.test(v));
    }
    setSuggestions(sortedSuggestions);
    setFriendToSearch(value);
  };

  // Sends friend request to user being searched...
  const sendFriendRequest = () => {
    document.getElementById('friendInput').value = '';
    setShowSuggestions(false);
    axios.get('/session').then(({ data }) => {
      axios
        .get(`/findFriend/${friendToSearch}/${data.name}`)
        .then(({ data }) => {
          setWarnMessage(data);
          setTimeout(() => setWarnMessage(''), 3000);
        })
        .catch((err) => console.info(err));
    });
  };

  // Grabs the current users friendsList...
  const getFriendsList = () => {
    axios.get('/session').then(({ data }) => {
      axios.get(`/friends/${data.name}`).then(({ data }) => {
        setFriendsList(data);
      });
    });
  };

  const getMessagesList = () => {
    axios
      .get('/session')
      .then(({ data }) => axios.get(`/messages/${data.email}`))
      .then(({ data }) => setMessages(data));
  };

  const clickHandler = () => {
    axios.get('/session').then(({ data }) => {
      const time = new Date();
      const newMessage = {
        name: data.name,
        message: messageText,
        time: String(time).replace('GMT-0600 (Central Standard Time)', ''),
      };
      const exampleMessage = messages;
      if (exampleMessage[currentDms.name]) {
        exampleMessage[currentDms.name] = [
          ...messages[currentDms.name],
          newMessage,
        ];
      } else {
        exampleMessage[currentDms.name] = [newMessage];
      }
      setMessageText('');
      axios
        .post(`/messages/${data.email}`, {
          message: newMessage,
          user: currentDms.email,
          from: data.name,
          to: currentDms.name,
        })
        .then(() => socket.emit('sent'))
        .catch((err) => console.warn(err));
    });
  };

  const handleUnfriend = (id) => {
    axios.get('/session').then(({ data }) => {
      axios
        .put('/unfriend', { user: data.name, id })
        .then(() => getFriendsList());
    });
  };

  const handleSuggestionChoice = (suggestion) => {
    setShowSuggestions(false);
    const input = document.getElementById('friendInput');
    input.value = suggestion;
    setFriendToSearch(input.value);
  };

  // socket.on('recived', () => getMessagesList());

  useEffect(() => getFriendsList(), []);

  useEffect(() => getMessagesList(), {});

  return (
    <div className="Profile">
      {!users.length ? getUsers() : null}
      <link
        href="https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Roboto:wght@300&display=swap"
        rel="stylesheet"
      />
      <Navbar />
      <Sidebar />
      <div className="friends-container">
        <div className="main">
          {warnMessage ? <div id="warnMessage">{warnMessage}</div> : null}
          <div className="friends">
            <div className="inputAndSuggestions">
              <input
                id="friendInput"
                type="text"
                placeholder="Search for Budz"
                onChange={friendSearchOnChange}
                className="addFriendInput"
                autoComplete="off"
              />
              <input
                type="submit"
                className="addFriendButton"
                value="Add Friend"
                onClick={sendFriendRequest}
              />
              {showSuggestions
                ? suggestions.map((suggestion) => (
                    <div
                      className="suggestions"
                      onClick={handleSuggestionChoice.bind(this, suggestion)}
                    >
                      {suggestion}
                    </div>
                  ))
                : null}
            </div>
            <div className="listOfFriends">
              {friendsList.map((friend) => (
                <div className="friendsList">
                  <h3 onClick={() => setCurrentDms(friend)}>{friend.name}</h3>
                  <button
                    onClick={handleUnfriend.bind(this, String(friend._id))}
                  >
                    Unfriend
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="messages">
            {messages[currentDms.name]
              ? messages[currentDms.name].map(({ name, message, time }) => (
                  <div>
                    <h2>{name}</h2>
                    <div>{message}</div>
                    <div>{time}</div>
                  </div>
                ))
              : null}
            <div>
              {currentDms.name ? (
                <div>
                  <TextField
                    id="standard-basic"
                    placeholder="type a message"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                  />
                  <Button variant="text" color="primary" onClick={clickHandler}>
                    send message
                  </Button>
                </div>
              ) : null}
              <img alt="" className="friend-pic" src={friendpic} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FriendsList;
