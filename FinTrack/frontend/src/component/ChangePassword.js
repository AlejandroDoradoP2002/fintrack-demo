import React, {useState, useEffect} from "react";
import { TextField, InputLabel, Button, Typography, Card } from "@mui/material";
import axios from "axios";
import {useNavigate} from "react-router-dom";
import { useSearchParams } from 'react-router-dom';

const ChangePassword = () => {
    
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const navigate = useNavigate();
    

    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    

      // Handle input changes
    
      // Handle form submission
      const handleSubmit = async (e) => {
        e.preventDefault(); 
        try{
            if(password != confirmPassword){
                setErrorMsg("Passwords do not match");
                return;
            }

            // must have pass in a token 
            if(token == null){
                setErrorMsg("invalid link");
                return;
            }
            let body = {
                "token" : token,
                "password" : password
            }

          // call api to validate the change password request 
          const response = await axios.post("http://127.0.0.1:8000/api/changePasswordRequest/", body);

          if(response.status === 200){
            alert("password has been reseted");
            navigate('/');
          }

          console.log(response.data);
         
        }
        catch(error){
          //setErrorMsg("Invalid Credentials");
          //setErrorMsg(error.response.data.error);
          
          console.log(error);
        }
      };
    

    return(
        <div className="center">
      <Card 
      sx={{
        px: 15, py:5,
        boxShadow: "rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px;"
      }}
      >
      <form
        style={{
          display: "flex",
          flexDirection: "column",
        }}
        onSubmit={handleSubmit}
      >
        {/* Centered Typography */}
        <Typography variant="h4" component="h3"sx={{ textAlign: "center", py: 1, fontWeight: 500 , mb: 3, color:"#0077b6"}}>
          Change Password
        </Typography>

        <InputLabel htmlFor="email" sx={{color: "#0077b6"}}>Password</InputLabel>
        <TextField type="password" helperText=" " id="email" name="email" color="#03045e" value={password} onChange={(e) => { setPassword(e.target.value)}} sx={{width: '12em'}}/>

        <InputLabel htmlFor="email" sx={{color: "#0077b6"}}>Confirm Password</InputLabel>
        <TextField helperText=" " type="password" id="email" name="email" color="#03045e" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value)}} sx={{width: '12em'}}/>

        {/* dynamically hide or show error message */}
        <Typography variant="caption" gutterBottom sx={{textAlign: 'center', mt: 1, height: '0.6em', color: 'red'}}>
            {errorMsg}
        </Typography>

        
        {/* Centered Button */}
        <Button
          variant="contained"
          type="submit"
          sx={{
            mt: 2,
            bgcolor: "#0077b6",
            color: "white",
            px: 3, // Horizontal padding
            py: 1, // Vertical padding
          }}
        >
          Change Password
        </Button>
    
      </form>
      </Card>
    </div>
    );
}

export default ChangePassword;