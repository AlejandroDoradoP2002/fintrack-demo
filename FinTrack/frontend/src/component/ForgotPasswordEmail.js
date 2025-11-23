import React, {useState, useEffect} from "react";
import { TextField, InputLabel, Button, Typography, Card } from "@mui/material";
import axios from "axios";
import {useNavigate} from "react-router-dom";

const ForgotPasswordEmail = () => {
    
    const [email, setEmail] = useState("");

      const [errorMsg, setErrorMsg] = useState("");
      const navigate = useNavigate();
    
      // Handle input changes
      const handleChange = (e) => {
        setEmail(e.target.value);
      };
    
      // Handle form submission
      const handleSubmit = async (e) => {
        e.preventDefault(); 
        try{
            let body = {
                "email" : email
            }
          const response = await axios.post("http://127.0.0.1:8000/api/sendForgetPasswordEmail/", body);
          console.log(response.data);
          alert("attempt to send link to email if it exists");
         
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
          Forgot Password
        </Typography>

        <InputLabel htmlFor="email" sx={{color: "#0077b6"}}>Email</InputLabel>
        <TextField helperText=" " id="email" name="email" color="#03045e" value={email} onChange={handleChange} sx={{width: '12em'}}/>

        
    
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
          Send To Email
        </Button>
    
      </form>
      </Card>
    </div>
    );
}

export default ForgotPasswordEmail;