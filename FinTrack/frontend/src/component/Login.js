import React, {useState, useEffect} from "react";
import { TextField, InputLabel, Button, Typography, Card } from "@mui/material";
import axios from "axios";
import {useNavigate} from "react-router-dom";

const Login = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); 
    try{
      const response = await axios.post("http://127.0.0.1:8000/api/loginAccount/", formData);
      console.log(response.data);
      localStorage.setItem("isAuthenticated", "true");
      navigate("/dashboard");
    }
    catch(error){
      //setErrorMsg("Invalid Credentials");
      setErrorMsg(error.response.data.error);
      localStorage.setItem("isAuthenticated", "false");
      console.log(error);
    }
  };

  useEffect(()=>{
    if(localStorage.getItem("isAuthenticated") === "true"){
      navigate("/dashboard");
    }
  },[navigate])

  
  return (
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
        <Typography variant="h3" component="h3"sx={{ textAlign: "center", py: 1, fontWeight: 500 , mb: 3, color:"#0077b6"}}>
          Login
        </Typography>

        <InputLabel htmlFor="username" sx={{color: "#0077b6"}}>Username</InputLabel>
        <TextField helperText=" " id="username" name="username" color="#03045e" value={formData.username} onChange={handleChange} sx={{width: '12em'}}/>

        <InputLabel htmlFor="password" sx={{color: "#0077b6"}}>Password</InputLabel>
        <TextField helperText="" id="password" name="password" type="password" color="#03045e" onChange={handleChange} value={formData.password} sx={{width: '12em'}}/>
        {/* <Typography variant="caption" component="caption">Wrong Credentials</Typography> */}
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
          Login
        </Button>
        <Typography variant="caption" gutterBottom sx={{textAlign: 'center', mt: 2, height: '0.6em', color: '#0077b6'}}>
            Need an account? <u style={{cursor: 'pointer'}} onClick={() => navigate("/signup")}>SIGN UP</u>
        </Typography>
        

        <Typography variant="caption" gutterBottom sx={{textAlign: 'center', mt: 2, height: '0.6em', color: '#0077b6'}}>
            <u style={{cursor: 'pointer'}} onClick={() => navigate("/forgotPassword")}>FORGOT PASSWORD</u>
        </Typography>
      </form>
      </Card>
    </div>
  );
};

export default Login;

