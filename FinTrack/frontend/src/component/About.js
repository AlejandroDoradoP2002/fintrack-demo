import React from "react";
import { Container, Typography, Grid, Card, CardContent, Avatar, Divider } from "@mui/material";

const developers = [
  { name: "Luke Evarretta", role: "Programmer", image: "http://localhost:8000/static/images/levarretta.jpg" },
  { name: "James Ngo", role: "Team Lead", image: "http://localhost:8000/static/images/James_Ngo.jpg" },
  { name: "Kian Aliwalas", role: "Quality Assurance", image: "https://placehold.co/150?text=K" },
  { name: "Amadea Koleci", role: "Database Administrator", image: "https://placehold.co/150?text=A" },
  { name: "Alejandro Dorado", role: "Modeling & Design", image: "https://placehold.co/150?text=A" },
];

const About = () => {
  return (
    
    <Container maxWidth="md" sx={{ textAlign: "center", mt: 5}}>
      <Typography variant="h4" gutterBottom className="blue2" sx={{fontWeight: "600"}}>Service</Typography>
      <Typography variant="h6" sx={{my: 1, py: 2}} className="blue2">
        FinTracker is a web application designed to simplify your financial management. 
        It enables you to effortlessly track your transactions, create and manage budgets, and gain real-time insights into your spending habits.
        By turning your financial data into actionable information, FinTracker helps you identify trends, optimize your expenditures, and make informed decisions to secure your financial future. 
        Whether you’re an individual or a small business,
        FinTracker offers a user-friendly interface and robust features that put you in complete control of your finances.
      </Typography>
      <Divider sx={{ mt: 5 }} />
      <Typography variant="h4" gutterBottom className="blue2" sx={{fontWeight: "600", mt: 5}}>About Us</Typography>
      <Typography variant="h6" sx={{my: 3}} className="blue2">
        We are a passionate team dedicated to building innovative solutions. Our mission is to create 
        user-friendly applications that enhance everyday experiences.
      </Typography>
      <Grid container spacing={3} justifyContent="center" sx={{pb: 5}}>
        {developers.map((developer, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card sx={{ textAlign: "center", p: 2 }}>
              <Avatar src={developer.image} alt={developer.name} sx={{ width: 160, height: 160, margin: "auto" }} />
              <CardContent>
                <Typography variant="h6" className="blue2">{developer.name}</Typography>
                {/* <Typography variant="body2" color="text.secondary" className="blue2">{developer.role}</Typography> */}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};
export default About

