import React, {useState, useEffect} from "react";
import { TextField, InputLabel, Button, Typography, Card } from "@mui/material";
import axios from "axios";
import {useNavigate} from "react-router-dom";

const SignUp = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
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

    const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); 
    try{
      if(formData.password !== confirmPassword){
        setErrorMsg("Passwords do not match");
        return;
      }
      const response = await axios.post("http://127.0.0.1:8000/api/registerAccount/", formData);
      console.log(response.data);
      navigate("/");


      // response would include account ID and email asscociated with account

      let responseData = response.data;
      console.log(response)
      let userId = responseData['user_account']['id'];
      let userEmail = responseData['user_account']['email'];

      let body = {
        'id': userId,
        'email': userEmail
      }

      const response1 = await axios.post("http://127.0.0.1:8000/api/sendAccountActivationEmail/", body);
      console.log(response1.data);


      // api to get the account ID 
       

      // Right after account creation send email out to activate their account 
      
    }
    catch(error){
      alert(error.response.data['error']);
      
      // setErrorMsg(error.response.data["error"]);
      console.log(error);
    //   console.log(error.response.data["error"]);
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
        method="post"
      >
        
        {/* Centered Typography */}
        <Typography variant="h3" component="h3"sx={{ textAlign: "center", py: 1, fontWeight: 500 , mb: 3, color:"#0077b6"}}>
          Sign Up
        </Typography>

        <InputLabel htmlFor="username" sx={{color: "#0077b6"}}>Username</InputLabel>
        <TextField helperText=" " id="username" name="username" color="#03045e" value={formData.username} onChange={handleChange} sx={{width: '12em'}} required/>

        <InputLabel htmlFor="email" sx={{color: "#0077b6"}}>Email Address</InputLabel>
        <TextField helperText="" id="email" name="email" type="email" color="#03045e" onChange={handleChange} value={formData.email} sx={{width: '12em', mb: 2}} required/>

        {/* <InputLabel htmlFor="password" sx={{color: "#0077b6"}}>Last Name</InputLabel>
        <TextField helperText="" id="password" name="password" type="password" color="#03045e" onChange={handleChange} value={formData.password} sx={{width: '12em'}} required/> */}
        <InputLabel htmlFor="confirmPassword" sx={{color: "#0077b6"}}>Confirm Password</InputLabel>
        <TextField helperText="" id="confirmPassword" name="confirmPassword" type="password" color="#03045e" onChange={handleConfirmPasswordChange} value={confirmPassword} sx={{width: '12em', mb: 2.2}} required/>
        


        <InputLabel htmlFor="password" sx={{color: "#0077b6"}}>Password</InputLabel>
        <TextField helperText="" id="password" name="password" type="password" color="#03045e" onChange={handleChange} value={formData.password} sx={{width: '12em'}} required/>
        
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
          Sign Up
        </Button>
        <Typography variant="caption" gutterBottom sx={{textAlign: 'center', mt: 2, height: '0.6em', color: '#0077b6'}}>
            Already have an account? <u style={{cursor: 'pointer'}} onClick={()=>navigate("/")}>LOGIN</u>
        </Typography>
      </form>
      </Card>
    </div>
  );
};

export default SignUp;

