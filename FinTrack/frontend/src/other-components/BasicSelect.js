import * as React from 'react';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const BasicSelect = ({category, setCategory,categoryID, setCategoryID }) => {
  // useEffect(() => {
  //   setCategory(null);
  //   setCategoryID(null);
  // }, [])
  

  const[categories , setCategories] = useState([]);
  const navigate = useNavigate();
      useEffect(() =>{
          //so this is called or mounted when the useEffect isloaded
          // so downside that the api is going to be called ever time it is open
          console.log("from basic select called ?")
          const fetchCategories = async () =>{
              try{
                  const response = await fetch("http://127.0.0.1:8000/api/getCategories");
                  const data = await response.json();
                //   console.log(data);
                  setCategories(data["categories"]);
                //   console.data(categories)
              }catch(error){
                localStorage.setItem("isAuthenticated", "false");
                navigate("/"); 
                console.log("error fetching categories", error);
              }
          }
          fetchCategories(); // on mount call api to set categories 
      },[]);

      const getCategories = (category_id) => {return categories.find(category => category.id === category_id)?.category_name;}
  

  const handleChange = (event) => {
    setCategory(getCategories(event.target.value));
    setCategoryID(event.target.value);
  };

  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl fullWidth>
        <Select
          id="demo-simple-select"
          value={categoryID}
          onChange={handleChange}
          required
          displayEmpty
        >
          <MenuItem value="" disabled>
            Select a category
          </MenuItem>
          {
            categories.map((categoryItem) => (
              <MenuItem key={categoryItem.id} value={categoryItem.id}>
                {categoryItem.category_name}
              </MenuItem>
            ))
          }
        </Select>
      </FormControl>
    </Box>
  );
}

export default BasicSelect;