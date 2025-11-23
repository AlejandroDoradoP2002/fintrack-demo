import * as React from 'react';
import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import TextField from '@mui/material/TextField';
import BasicSelect from './BasicSelect';
// import  { useAppContext } from "../Global/AppProvider";
import axios from 'axios';



const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

/**
 * 
 * date field
 * amount field
 * currency field
 * name field
 * 
 * submit button
 */

export default function BasicModalBudget({budgets, setBudgets, getCategory}) {

  //global access token 
//   const {accessToken , setAccessToken , refreshMount, setRefreshMount} = useAppContext();

  const [open, setOpen] = useState(false);
  // const handleOpen = () => setOpen(true);
  // const handleClose = () => {setOpen(false)};
  
  const [ amount , setAmount] = useState(null);
  const [category, setCategory] = useState(null);
  const [categoryID, setCategoryID] = useState(null);

  const handleOpen = () => {
    setAmount(null);
    setCategory(null);
    setCategoryID(null);
    setOpen(true);
  };
  const handleClose = () => {setOpen(false)};


  const handleBudget = async () => {
    axios.post("http://127.0.0.1:8000/api/createBudget/", {"amount": amount, "category": category})
    .then((response) => {
      console.log("Transaction added successfully:", response.data);
    //   console.log("asddas",category, typeof category);
      // let hasDuplicate = budgets.find(item => getCategory(item.category_id) === getCategory(category));
      // console.log("hasDuplicate", hasDuplicate);
      // if (!hasDuplicate) {
        setBudgets((prevBudgets) => [...prevBudgets, {amount: parseFloat(amount), category_id: category}]);
      // }
      // setAmount(null);
      // setCategory(null);
      // setCategoryID(null);
      handleClose();
    //   clearFields();
    })
    .catch((error) => {
      console.error("Error adding transaction:", error);
    });
    
    // setDate("");
    setAmount(null);
    setCategory(null);
    // setName("");
    setCategoryID(null);
    handleClose();
  }

  return (
    <div style={{width: "100%"}}>
      <Button onClick={handleOpen} sx={{color: "white", backgroundColor: "primary.main", mt: 1}}>Add Budget</Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        // sx={{borderRadius: 2}}
      >
        <Box 
        sx={{
          ...style, 
          borderRadius: 2, 
          border: "none", 
          width: {xs:"80vw", sm: "60vw", md: "20vw"},

        }}>
          <Typography id="modal-modal-title" variant="h5" component="h2" sx={{fontWeight: 500, color: "#0077b6"}}>
            Enter Budget
          </Typography>

          <div>
            <Typography variant="h6" component="h2" sx={{color: "#0077b6"}}>Category</Typography>
            <BasicSelect category={category} setCategory={setCategory} categoryID={categoryID} setCategoryID={setCategoryID} sx={{color: "#0077b6"}}/>
          </div>

        
          <div>
            <Typography variant="h6" component="h2" sx={{color: "#0077b6"}}>Amount $</Typography>
            {/* <input type='number' min="0.0" value={amount} onChange={(e) => setAmount(e.target.value)}/> */}
            <TextField
              id="amount"
              label="Amount"
              type="number"
              value={amount}
              onChange={(e) => {
                const value = parseFloat(e.target.value);

                if (value >= 0 || e.target.value === '') {
                  setAmount(e.target.value);
                }
              }}
              variant="filled"
              sx={{ mb: 2, color: "#0077b6" }}
              inputProps={{ min: 0.0 }}
              required
            />
          </div>

          

          <div>
            <Button disabled={category == null || amount == null ? true : false} onClick={handleBudget} variant='contained'>Submit budget</Button>
          </div>
          
          
          
       
         
          
        </Box>
      </Modal>
    </div>
  );
}