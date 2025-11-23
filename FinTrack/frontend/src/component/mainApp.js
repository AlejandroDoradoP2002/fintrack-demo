import React from "react";
import { Container, Typography, Avatar, Box, TextField, Button, IconButton, Collapse, CircularProgress,
Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Divider, Pagination
} from "@mui/material";

// import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; 
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DeleteIcon from '@mui/icons-material/Delete';
import BasicModal from "../other-components/BasicModal";
import ChartDashboard from "../other-components/ChartDashboard";
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CategoryProgressBars from "../other-components/CategoryProgressBars";
import BasicModalBudget from "../other-components/BasicModalBudget";
import ModalQuickAnalyzation from "../other-components/ModalQuickAnalyzation";

const months = {
    0: "January",
    1: "February",
    2: "March",
    3: "April",
    4: "May",
    5: "June",
    6: "July",
    7: "August",
    8: "September",
    9: "October",
    10: "November",
    11: "December",
};

function MainApp() {
    const currentMonth = new Date().getMonth(); 
    const [expanded, setExpanded] = useState(false);
    const [message, setMessage] = useState("");
    const [chat, setChat] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortTransConfig, setSortTransConfig] = useState({ key: null, direction: "asc" });
    const [sortBudgetConfig, setSortBudgetConfig] = useState({ key: null, direction: "asc" });
    const [totalBudget, setTotalBudget] = useState(0);
    const [username, setUsername] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedFile, setSelectedFile] = useState(null);
    const itemsPerPage = 10;
    const bottomRef = useRef(null);

    const navigate = useNavigate();
  
    // const handleSendMessage = async () => {
    //   if (!message.trim()) return;
    
    //   const newChat = [...chat, { type: "user", content: message }];
    //   setChat(newChat);
    //   setMessage("");//clear the message
    
    //   const updatedChat = [...newChat, { type: "ai", content: <CircularProgress size="1.7em" color="white"/> }];
    //   setChat(updatedChat);
    
    //   try {
    //     const response = await axios.post("http://127.0.0.1:8000/api/chat/", { message });
    
    //     setChat([...updatedChat.slice(0, -1), { type: "ai", content: response.data.response }]);
    //   } catch (error) {
    //     console.error("Error communicating with AI:", error);
    //   }
    // };  

    const handleSendMessage = async () => {
      // Don't send if message is empty
      if (!message.trim()) return;
    
      // Add the message to the chat
      const newChat = [...chat, { type: "user", content: message }];
      setChat(newChat);
      setMessage(""); // Clear the message input field
    
      // Add a loading indicator for the AI response
      const updatedChat = [
        ...newChat,
        { type: "ai", content: <CircularProgress size="1.7em" color="white" /> },
      ];
      setChat(updatedChat);
    
      // Prepare the FormData object
      const formData = new FormData();
      formData.append("message", message); // Always add message to FormData
    
      // If a file is selected, append it to FormData
      if (selectedFile) {
        formData.append("file", selectedFile);
      }
    
      try {
        // Send the message and file (if any) to the backend
        const response = await axios.post("http://127.0.0.1:8000/api/chat/", formData, {
          headers: {
            "Content-Type": "multipart/form-data", // Important for sending files
          },
        });

        axios.get("http://127.0.0.1:8000/api/getUserTransactions/")
        .then((response) => {
          // console.log(response.data["transactions"]);
          setTransactions(response.data["transactions"]);
          // console.log(transactions);
        })
        .catch((error) => {
          console.error("Error fetching transactions:", error);
          localStorage.setItem("isAuthenticated", "false");
          navigate("/"); 
        });
    
        // Replace the loading indicator with the AI response
        setChat([
          ...updatedChat.slice(0, -1),
          { type: "ai", content: response.data.response },
        ]);
        setSelectedFile(null); // Clear the selected file after sending
      } catch (error) {
        console.error("Error communicating with AI:", error);
      }
    };

    const handleFileChange = (event) => {
      const file = event.target.files[0];
      if (file) {
        setSelectedFile(file);
      }
    
      // Reset the input value so selecting the same file again triggers onChange
      event.target.value = null;
    };
    
    

    useEffect(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chat]);

    
    useEffect(()=>{
      // console.log("Selected file changed:", selectedFile);
    }, [selectedFile])
    
    useEffect(()=> {
      axios.get("http://127.0.0.1:8000/api/getMessages/")
      .then((response) => {
        let i = 1;
        let dict = [];
        response.data["response"].forEach((msg) => {
          dict.push({ type: (i % 2 === 0 ? "ai" : "user"), content: msg });
          i++;
        });
        setChat(dict);
      })
      .catch((error) => {
        console.error("Error fetching messages:", error);
      });
      axios.get("http://127.0.0.1:8000/api/getCategories/")
      .then((response) => {
        // console.log(response.data["categories"]);
        setCategories(response.data["categories"]);
      })
      .catch((error) => {
        console.error("Error fetching categories:", error);
        localStorage.setItem("isAuthenticated", "false");
        navigate("/"); 
      });
    }, []);

    useEffect(() => {
      axios.get("http://127.0.0.1:8000/api/getUserTransactions/")
      .then((response) => {
        // console.log(response.data["transactions"]);
        setTransactions(response.data["transactions"]);
        // console.log(transactions);
      })
      .catch((error) => {
        console.error("Error fetching transactions:", error);
        localStorage.setItem("isAuthenticated", "false");
        navigate("/"); 
      });
      axios.get("http://127.0.0.1:8000/api/getUserBudgets/")
      .then((response) => {
        // console.log(response.data["budgets"]);
        setBudgets(response.data["budgets"]);
        // console.log(budgets);
      })
      .catch((error) => {
        console.error("Error fetching budgets:", error);
        localStorage.setItem("isAuthenticated", "false");
        navigate("/"); 
      });

      axios.get("http://127.0.0.1:8000/api/getUsername/")
      .then((response) => {
        // console.log(response.data["budgets"]);
        setUsername(response.data["username"]);
        // console.log(budgets);
      })
      .catch((error) => {
        console.error("Error fetching budgets:", error);
        localStorage.setItem("isAuthenticated", "false");
        navigate("/"); 
      });

    }, []);

    useEffect(() => {
      let total = 0;
      // console.log("Yerr");
      budgets.forEach((budget) => {
        total += budget.amount;
      });
      setTotalBudget(total);
    }, [budgets]);


  
    

    const resetThreadClick = async () => {
      try {
        await axios.post("http://127.0.0.1:8000/api/deleteThread/");
        setChat([]); // Clear the chat state
      }
      catch (error) {
        console.error("Error resetting thread:", error);
      }

    }


    const getCategoriesID = (category_name) => {return categories.find(category => category.category_name === category_name)?.id;} //returns a number of a category id
    const getCategories = (category_id) => {return categories.find(category => category.id === category_id)?.category_name;} //returns a string of a category name
    // this is for search
    const filteredTransactionData = transactions.filter((row) =>
      (row.transaction_name && row.transaction_name.toLowerCase().includes(searchTerm.toLowerCase())) || // Check for transaction_name
      (getCategories(row.category_id) && getCategories(row.category_id).toLowerCase().includes(searchTerm.toLowerCase())) || // Check if category exists
      (row.transaction_date && row.transaction_date.includes(searchTerm)) || // Ensure row.date is a string
      (row.amount && row.amount.toString().includes(searchTerm)) // Ensure row.amount is a number 
    );
    

    const sortedFinancialData = [...filteredTransactionData].sort((a, b) => {
      if (!sortTransConfig.key) return 0;
    
      let aValue = a[sortTransConfig.key];
      let bValue = b[sortTransConfig.key];
    
      // Handle numeric sort
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortTransConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
      }
    
      // Handle string sort
      aValue = String(aValue).toLowerCase();
      bValue = String(bValue).toLowerCase();
    
      if (aValue < bValue) return sortTransConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortTransConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    const paginatedTransactionData = sortedFinancialData.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );

    useEffect(() => {
      setCurrentPage(1);
    }, [sortTransConfig]);

    const handleTransactionSort = (key) => {
      setSortTransConfig((prev) => ({
        key,
        direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
      }));
    };


    // const filteredBudgetData = budgets.filter((row) =>
    //   (getCategories(row.category_id) && getCategories(row.category_id).toLowerCase().includes(searchTerm.toLowerCase())) || // Check if category exists
    //   (row.amount && row.amount.toString().includes(searchTerm)) // Ensure row.amount is a number 
    // );


    const sortedBudgetData = budgets.sort((a, b) => {
      if (!sortBudgetConfig.key) return 0;
    
      let bValue = b[sortBudgetConfig.key];
      let aValue = a[sortBudgetConfig.key];
    
      // Handle numeric sort
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortBudgetConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
      }
    
      // Handle string sort
      aValue = String(aValue).toLowerCase();
      bValue = String(bValue).toLowerCase();
    
      if (aValue < bValue) return sortBudgetConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortBudgetConfig.direction === "asc" ? 1 : -1;
      return 0;
    });


    
    const handleBudgetSort = (key) => {
      setSortBudgetConfig((prev) => ({
        key,
        direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
      }));
    };

    const deleteFirstMatchTransaction = (row) => {
      // const id = (typeof row.category_id === "number" ? row.category_id : getCategoriesID(row.category_id));
      const index = transactions.findIndex((index) => index.category_id === row.category_id && index.transaction_name === row.transaction_name && index.amount === row.amount && index.transaction_date === row.transaction_date);
      if (index !== -1) {
        const updatedUsers = [
          ...transactions.slice(0, index),
          ...transactions.slice(index + 1)
        ];
        // console.log("updatedUsers", updatedUsers);
        setTransactions(updatedUsers);
      }
    }

    const deleteFirstMatchBudget = (row) => {
      // const id = (typeof row.category_id === "number" ? row.category_id : getCategoriesID(row.category_id));
      const index = budgets.findIndex((index) => index.category_id === row.category_id && index.transaction_name === row.transaction_name && index.amount === row.amount && index.transaction_date === row.transaction_date);
      if (index !== -1) {
        const updatedUsers = [
          ...budgets.slice(0, index),
          ...budgets.slice(index + 1)
        ];
        // console.log("updatedUsers", updatedUsers);
        setBudgets(updatedUsers);
      }
    }

    const handleDeleteTransaction = async (row) => {
      // console.log(row);
      axios.post("http://127.0.0.1:8000/api/deleteTransaction/", {transaction_date: row.transaction_date, transaction_name: row.transaction_name, amount: row.amount, category_id: (typeof row.category_id === "number") ? row.category_id : getCategoriesID(row.category_id)})
      .then((response) => {
        deleteFirstMatchTransaction(row);
        // console.log("Transaction deleted successfully:", response.data);
      })
      .catch((error) => {
        console.error("Error deleting transaction:", error);
      });
    };

    const handleDeleteBudget = async (row) => {
      // console.log(row);
      axios.post("http://127.0.0.1:8000/api/deleteBudget/", {amount: row.amount, category_id: (typeof row.category_id === "number") ? row.category_id : getCategoriesID(row.category_id)})
      .then((response) => {
        deleteFirstMatchBudget(row);
        // console.log("Transaction deleted successfully:", response.data);
      })
      .catch((error) => {
        console.error("Error deleting transaction:", error);
      });
    };
    
    

    // console.log("budgets: ",budgets);

    
    return (        
        <Container maxWidth="md" sx={{ textAlign: "center", mt: 5 }}>
        <Avatar alt={username} src={`https://placehold.co/150?text=${username.charAt(0).toUpperCase()}`} sx={{ width: 80, height: 80, margin: "auto" }} />
        <Typography variant="h6" className="blue2" sx={{ mt: 1.5 }}>
          {months[currentMonth]}'s Total Budget
        </Typography>
        <Typography variant="body2" className="blue2" sx={{ fontWeight: "600" }}>${totalBudget}</Typography>
        {/* <LinearProgress variant="determinate" value={50} sx={{ height: 10, borderRadius: 5, my: 5 }} /> */}
        <Divider sx={{ my: 2 }} />
        <CategoryProgressBars transactions={transactions} budgets={budgets} getCategories={getCategories}/>
        {/* <PieChart
          series={[
            {
              data: [
                { id: 0, value: 10, label: 'Grocerries' },
                { id: 1, value: 15, label: 'Entertainment' },
                { id: 2, value: 20, label: 'Restaturant' },
              ],
            },
          ]}
          width={350}
          height={200}
        /> */}
        <ChartDashboard transactions={transactions} categories={categories} getCategories={getCategories}/>

        <div style={{paddingBottom: "5em"}}>

          
            <Box
              display="flex"
              flexDirection={{ xs: "column", sm: "column", md: "row" }} // xs & sm = column, md+ = row
              gap={"2em"} // adds spacing between items
              // sx={{pd: "20em"}}
            >

              {/* This is the transactions table */}
            <Paper sx={{ padding: "2em", borderRadius: "3em"}}>
                <Typography variant="h5" gutterBottom className="blue2" sx={{fontWeight: "500"}}>Transactions</Typography>
                <TextField
                  label="Search"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <BasicModal transactions={transactions} setTransactions={setTransactions}/> {/* Add Transaction Button */}
                <TableContainer>
                  <Table aria-label="expenses table">
                    <TableHead>
                      <TableRow>
                        <TableCell onClick={() => handleTransactionSort("transaction_date")} style={{ cursor: "pointer" }}>
                          <strong>Date {sortTransConfig.key === "transaction_date" ? (sortTransConfig.direction === "asc" ? "⬆️" : "⬇️") : ""}</strong>
                        </TableCell>
                        <TableCell onClick={() => handleTransactionSort("transaction_name")} style={{ cursor: "pointer" }}>
                          <strong>Transaction Name {sortTransConfig.key === "transaction_name" ? (sortTransConfig.direction === "asc" ? "⬆️" : "⬇️") : ""}</strong>
                        </TableCell>
                        <TableCell onClick={() => handleTransactionSort("amount")} style={{ cursor: "pointer" }} align="right">
                          <strong>Amount ($) {sortTransConfig.key === "amount" ? (sortTransConfig.direction === "asc" ? "⬆️" : "⬇️") : ""}</strong>
                        </TableCell>
                        <TableCell onClick={() => handleTransactionSort("category_id")} style={{ cursor: "pointer" }}>
                          <strong>Category {sortTransConfig.key === "category_id" ? (sortTransConfig.direction === "asc" ? "⬆️" : "⬇️") : ""}</strong>
                        </TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedTransactionData.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row.transaction_date}</TableCell>
                          <TableCell>{row.transaction_name}</TableCell>
                          <TableCell align="right">{row.amount.toFixed(2)}</TableCell>
                          <TableCell>{typeof row.category_id === "string" ? row.category_id : getCategories(row.category_id)}</TableCell>
                          <TableCell>
                            <IconButton onClick={() => handleDeleteTransaction(row)} aria-label="delete">
                              <DeleteIcon color="error" />
                            </IconButton>
                          </TableCell>


                        </TableRow>
                      ))}
                      {filteredTransactionData.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            No results found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <Box display="flex" flexDirection="row" justifyContent="center" mt={2}>
                    <Pagination
                      // sx={{display: "flex", flexDirection: "row"}}
                      count={Math.ceil(sortedFinancialData.length / itemsPerPage)}
                      page={currentPage}
                      onChange={(event, value) => setCurrentPage(value)}
                      color="primary"
                      shape="rounded"
                    />
                  </Box>
                </TableContainer>
              </Paper>

              {/* This is for the budget */}
              <Paper sx={{ padding: "2em", borderRadius: "3em"}}>
                <Typography variant="h5" gutterBottom className="blue2" sx={{fontWeight: "500"}}>Budgets</Typography>
                {/* <Typography variant="h6" gutterBottom className="blue2" sx={{fontWeight: "500"}}>Total Budget: ${totalBudget}</Typography> */}
                <Typography variant="caption" gutterBottom sx={{fontStyle: "italic", color: 'rgba(0, 0, 0, 0.30)'}}>Budget is applied for the month</Typography>
                <BasicModalBudget budgets={budgets} setBudgets={setBudgets} getCategory={getCategories}/>
                <TableContainer>
                  <Table aria-label="expenses table">
                    <TableHead>
                      <TableRow>
                        <TableCell onClick={() => handleBudgetSort("amount")} style={{ cursor: "pointer" }} align="right">
                          <strong>Amount ($) {sortBudgetConfig.key === "amount" ? (sortBudgetConfig.direction === "asc" ? "⬆️" : "⬇️") : ""}</strong>
                        </TableCell>
                        <TableCell onClick={() => handleBudgetSort("category_id")} style={{ cursor: "pointer" }}>
                          <strong>Category {sortBudgetConfig.key === "category_id" ? (sortBudgetConfig.direction === "asc" ? "⬆️" : "⬇️") : ""}</strong>
                        </TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sortedBudgetData.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell align="right">{row.amount.toFixed(2)}</TableCell>
                          <TableCell>{typeof row.category_id === "string" ? row.category_id : getCategories(row.category_id)}</TableCell>
                          <TableCell>
                          <IconButton onClick={() => handleDeleteBudget(row)} aria-label="delete">
                              <DeleteIcon color="error" />
                            </IconButton>
                          </TableCell>

                        </TableRow>
                      ))}
                      {budgets.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            No results found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Box>
            <ModalQuickAnalyzation />
        </div>


        {/* This is the the chatbot */}
        <div style={{backgroundColor: "#90e0ef", zIndex:1000}}>
        <Box
          sx={{
            position: "fixed",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            width: {xs: "85%", sm: "85%", md: "70%" }, 
            // height: {xs: "auto", sm: "15em", md: "em" },
            textAlign: "center",
            zIndex: 1000, 
            // bgcolor: "white",
          }}
          fullWidth
        >
          {/* Expand Button */}
          <IconButton
            onClick={() => setExpanded(!expanded)}
            sx={{
              transition: "transform 0.3s ease",
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              // bgcolor: "#0077b6",
              // color: "white",
              borderRadius: "50%",
              width: 50,
              height: 50,
              boxShadow: 3
            }}
          >
            <ExpandLessIcon />
          </IconButton>
  

          <Collapse in={expanded} timeout="auto">
            <Box
              sx={{
                position: "absolute",
                bottom: 60, 
                left: "50%", 
                transform: "translateX(-50%)", 
                width: "100%", 
                bgcolor: "#caf0f8",
                borderRadius: 2,
                boxShadow: 3,
                p: 2,
                // transition: "0.3s ease"
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography variant="h5" gutterBottom className="blue2" sx={{ fontWeight: "500" }}>
                  FinTracker AI Assistant
                </Typography>

                <IconButton onClick={resetThreadClick}>
                  <DeleteIcon sx={{color: "primary.main"}} />
                </IconButton>
              </Box>
              <Box 
              sx={{ overflowY: "auto",
              p: 1,
              mb: 2, 
              height: "37vh", 
              
              bgcolor: "#90e0ef", 
              borderRadius: 2 }}
              // gap="2em"
              >
                {chat.map((msg, index) => (
                  <Typography
                    variant="body1"
                    key={index}
                    sx={{
                      textAlign: msg.type === "user" ? "right" : "left",
                      bgcolor: msg.type === "user" ? "primary.light" : "#298fc4",
                      p: 1,
                      borderRadius: 1,
                      mb: 1,
                      color: "white",
                      whiteSpace: "pre-line", // Preserve line breaks
                    }}
                  >
                    {msg.content}
                  </Typography>
                ))}
                <div ref={bottomRef} /> {/* Scroll to the bottom of the chat */}
              </Box>
  
              {/* Input Field & Send Button */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" , mb: 1}}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault(); // Prevents a new line from being added
                    handleSendMessage();
                  }
                }}
                sx={{ mb: 2}}
              />
              <div style={{ display: "inline-block", position: "relative" }}>
                <input
                  type="file"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  id="file-input"
                />
                <label htmlFor="file-input">
                  <IconButton component="span" sx={{ color: "primary.main", mx: 1 }}>
                    <AttachFileIcon />
                  </IconButton>
                </label>
                <IconButton onClick={() => setSelectedFile(null)} sx={{ color: "primary.main" , fontSize: "0.8em", position: "absolute", top: "-2.2em", left: "0.5em"}}  >
                  {(selectedFile) ?  (selectedFile.name.substring(0, 2)+".. x") : ""}
                </IconButton>
              </div>
              </div>
              <Button variant="contained" fullWidth onClick={handleSendMessage}>
                Send
              </Button>
              
            </Box>
          </Collapse>
        </Box>
        </div>
      </Container>
     );
};
export default MainApp;

