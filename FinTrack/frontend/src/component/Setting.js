// import React from "react";
// import { Container, Typography, Grid, Card, CardContent, Avatar } from "@mui/material";

// function Setting() {
//     return (
//          <Container maxWidth="md" sx={{ textAlign: "center", mt: 5}}>
//             <Typography variant="h4" className="blue2" sx={{fontWeight: "600"}}>Setting</Typography>
//          </Container>
//      );
// }
// export default Setting

import React, { useState } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Box
} from '@mui/material';

import axios from 'axios';

const Setting = () => {
  const [form, setForm] = useState({
    newUsername: '',
    newEmail: '',
    currentPasswordForUsername: '',
    currentPasswordForEmail: '',
    newPassword: '',
    confirmNewPassword: '',
    currentPasswordForPassword: ''
  });
  const [messageUsername, setMessageUsername] = useState('');
  const [messageEmail, setMessageEmail] = useState('');
  const [messagePassword, setMessagePassword] = useState('');

  const [isErrorUser, setIsErrorUser] = useState(true);
  const [isErrorEmail, setIsErrorEmail] = useState(true);
  const [isErrorPassword, setIsErrorPassword] = useState(true);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUsernameChange = () => {
    if (!form.currentPasswordForUsername) {
      setMessageUsername("Please enter current password.");
      return;
    }

    axios.post("http://127.0.0.1:8000/api/changeUsername/", {username: form.newUsername, password: form.currentPasswordForUsername})
    .then(response => {
      console.log("Username changed successfully:", response.data);
      setIsErrorUser(false);
      setMessageUsername("Username changed successfully.");
      
    })
    .catch(error => {
    
        setMessageUsername(error.response.data["error"]);

    });
    setIsError(true);
    // Handle username change logic here
    // console.log("Username changed to:", form.newUsername);

  };

  const handleEmailChange = () => {
    if (!form.currentPasswordForEmail) {
      setMessageEmail("Please enter current password.");
      return;
    }

    axios.post("http://127.0.0.1:8000/api/changeEmail/",{email: form.newEmail, password: form.currentPasswordForEmail})
    .then(response => {
      console.log("Email changed successfully:", response.data);
      setIsErrorEmail(false);
      setMessageEmail("Email changed successfully.");
    })
    .catch(error => {
        setMessageEmail(error.response.data["error"]);
    });
    setIsErrorEmail(true);
    // Handle email change logic here
    // console.log("Email changed to:", form.newEmail);
  };

  const handlePasswordChange = () => {
    if (form.newPassword !== form.confirmNewPassword) {
      console.log("newPassword", form.newPassword, "confirmNewPassword", form.confirmNewPassword);
      setMessagePassword("New passwords do not match.");
      return;
    }
    if (!form.currentPasswordForPassword) {
      setMessagePassword("Please enter current password.");
      return;
    }
    // Handle password change logic here
    // console.log("Password updated.");
    axios.post("http://127.0.0.1:8000/api/changePassword/", {password: form.currentPasswordForPassword, newPassword: form.newPassword})
    .then(response => {
      console.log("Password changed successfully:", response.data);
      setIsErrorPassword(false);
      setMessagePassword("Password changed successfully.");
    })
    .catch(error => {
        setMessagePassword(error.response.data["error"]);
    });

    setIsErrorPassword(true);
  };

  const getMessageColor = (theError) => theError ? 'red' : 'green';

  
  return (
    <Container maxWidth="sm" sx={{textAlign: "center", mt: 5, pb: 5}}>
      <Typography variant="h4" className="blue2" sx={{fontWeight: "600", mb: 5}} >Settings</Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 4 , display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 2}}>
        <Typography variant="h6" sx={{color: "#0077b6"}}gutterBottom>Change Username</Typography>
        <TextField
          fullWidth
          label="New Username"
          name="newUsername"
          margin="normal"
          value={form.newUsername}
          onChange={handleChange}
        />
        <TextField
          fullWidth
          label="Current Password"
          type="password"
          name="currentPasswordForUsername"
          margin="normal"
          value={form.currentPasswordForUsername}
          onChange={handleChange}
        />
        <Typography variant="caption" gutterBottom sx={{textAlign: 'center', mt: 1, height: '1.5em', color: getMessageColor(isErrorUser)}}>
            {messageUsername}
        </Typography>
        <Button variant="contained" onClick={handleUsernameChange}>
          Update Username
        </Button>
      </Paper>

      <Paper elevation={3} sx={{ p: 3, mb: 4 , display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 2}}>
        <Typography variant="h6" sx={{color: "#0077b6"}}gutterBottom>Change Email</Typography>
        <TextField
          fullWidth
          label="New Email"
          name="newEmail"
          margin="normal"
          value={form.newEmail}
          onChange={handleChange}
        />
        <TextField
          fullWidth
          label="Current Password"
          type="password"
          name="currentPasswordForEmail"
          margin="normal"
          value={form.currentPasswordForEmail}
          onChange={handleChange}
        />
        <Typography variant="caption" gutterBottom sx={{textAlign: 'center', mt: 1, height: '1.5em', color: getMessageColor(isErrorEmail)}}>
            {messageEmail}
        </Typography>
        <Button variant="contained" onClick={handleEmailChange}>
          Update Email
        </Button>
      </Paper>

      <Paper elevation={3} sx={{ p: 3, mb: 4 , display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 2}}>
        <Typography variant="h6" gutterBottom sx={{color: "#0077b6"}}>Change Password</Typography>
        <TextField
          fullWidth
          label="New Password"
          type="password"
          name="newPassword"
          margin="normal"
          value={form.newPassword}
          onChange={handleChange}
        />
        <TextField
          fullWidth
          label="Confirm New Password"
          type="password"
          name="confirmNewPassword"
          margin="normal"
          value={form.confirmNewPassword}
          onChange={handleChange}
        />
        <TextField
          fullWidth
          label="Current Password"
          type="password"
          name="currentPasswordForPassword"
          margin="normal"
          value={form.currentPasswordForPassword}
          onChange={handleChange}
        />
        <Typography variant="caption" gutterBottom sx={{textAlign: 'center', mt: 1, height: '1.5em', color: getMessageColor(isErrorPassword)}}>
            {messagePassword}
        </Typography>
        <Button variant="contained" onClick={handlePasswordChange}>
          Update Password
        </Button>
      </Paper>
    </Container>
  );
};

export default Setting;
