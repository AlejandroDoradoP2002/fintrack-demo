import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppBar, Typography, Toolbar, Box, Button, Menu, MenuItem, CircularProgress } from "@mui/material";
import About from "./About";
import Setting from "./Setting";
import MainApp from "./mainApp";
import axios from "axios";



function MainPage() {
    const navigate = useNavigate();
    
    // const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const [AboutSt, setAboutSt] = useState(false);
    const [SettingSt, setSettingSt] = useState(false);
    const [MainAppSt, setMainAppSt] = useState(true);

    const handleClickAbout = () => {
        setMainAppSt(false);
        setAboutSt(true);
        setSettingSt(false);
      }
    
      const handleClickServices = () => {
        setMainAppSt(false);
        setAboutSt(false);
        setSettingSt(true);
      }
    
      const handleClickMainApp = () => {
        setMainAppSt(true);
        setAboutSt(false);
        setSettingSt(false);
      }
      const handleClick = (event) => {
        // console.log(event.currentTarget);
        setAnchorEl(event.currentTarget);
      };
      const handleClose = (event) => {
        // console.log(event.currentTarget);
        setAnchorEl(null);
      };
      const handleLogout = (event) => {
        axios.post("http://127.0.0.1:8000/api/logoffAccount/").then(() => {
          localStorage.setItem("isAuthenticated", "false");
          navigate("/");  
        })
        .catch((error) => {
          // console.log("Error fetching dashboard:", error);
          localStorage.setItem("isAuthenticated", "false");
          navigate("/"); 
        });
      }

      useEffect(()=> {
        const fetchDashboard = async () => {
          try {
            const response = await axios.get("http://127.0.0.1:8000/api/authenticate");
            console.log(response.data);
            localStorage.setItem("isAuthenticated", "true");
            setLoading(false);
          } catch (error) {
            if (error.response && error.response.status === 401) {
              localStorage.setItem("isAuthenticated", "false");
              navigate("/"); 
            } else {
              localStorage.setItem("isAuthenticated", "false");
              navigate("/");
            }
          }
        };
        fetchDashboard();

      }, []);

      if (loading) {
        return (
          <div className="center">
            <CircularProgress color="secondary" />
          </div>
        );
      }

    return (
        <div>
        <AppBar 
        position="sticky" 
        sx={{
           bgcolor: "0077b6", 
          //  py: "1vh",
          //  height: {xs: "auto", sm: "auto", md: "auto"},
        }}
        >
        <Toolbar>
          {/* Logo or app name */}
          <Typography
            // variant={{xs: "h3", sm: "h3", md: "h3"}}
            sx={{
              flexGrow: 1,
              mr: 2,
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '0.01em',
              color: 'inherit',
              textDecoration: 'none',
              fontSize: {xs: "1.5em", sm: "1.5em", md: "4vh"},
              px: 2
              // cursor: 'pointer',
            }}
          >
            <span style={{cursor: 'pointer', fontSize: "1.5em"}} onClick={() => window.location.reload()}>FinTracker</span>
          </Typography>


          <Box sx={{ display: {xs: 'none', sm: 'flex'} }}>
            <Button color="inherit" onClick={handleClickMainApp}>Home</Button>
            <Button color="inherit" onClick={handleClickAbout}>About</Button>
            <Button color="inherit" onClick={handleClickServices}>Setting</Button>
            <Button color="inherit" onClick={handleLogout}>Logout</Button>
          </Box>
          <Button
            id="basic-button"
            aria-controls={open ? 'basic-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
            onClick={handleClick}
            color="inherit"
            sx={{
              display: {xs: 'block', sm: 'none'}
            }}
          >
          menu
          </Button>
          <Menu
            id="basic-menu"
            anchorEl={anchorEl}
            open={open} //controls the visibility of the menu
            onClose={handleClose}
            sx={{display: {sm: 'none'}}}
          >
            <MenuItem onClick={handleClickMainApp} className="blue2">Home</MenuItem>
            <MenuItem onClick={handleClickAbout} className="blue2">About</MenuItem>
            <MenuItem onClick={handleClickServices} className="blue2">Setting</MenuItem>
            <MenuItem onClick={handleLogout} className="blue2">Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <div>
        {MainAppSt && <MainApp />}
        {AboutSt && <About />}
        {SettingSt && <Setting />}
      </div>
      
    </div>
    );
}

export default MainPage