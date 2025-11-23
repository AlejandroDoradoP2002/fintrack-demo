import * as React from 'react';
import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import TextField from '@mui/material/TextField';
import axios from 'axios';
import {CircularProgress} from "@mui/material";

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

export default function ModalQuickAnalyzation() {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setSelectedFile(null);
    setChat("");
    setOpen(false);
  };

  const [selectedFile, setSelectedFile] = useState(null);
  const [chat, setChat] = useState("");

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
    event.target.value = selectedFile; // Reset for same file re-select
  };

  const handleClear = () => {
    setSelectedFile(null);
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      setChat(<CircularProgress size="1.7em" color="white" />);
      const res = await axios.post("/api/quickAnalyze/", formData); // Change endpoint as needed
    //   console.log(res.data["response"]);
      setChat(res.data?.response || "No result returned.");
    } catch (err) {
      setChat("Error analyzing file.");
    }
  };

  return (
    <div style={{ width: "100%", marginTop: 2 }}>
      <Button
        onClick={handleOpen}
        sx={{ color: "white", backgroundColor: "primary.main", mt: 2, borderRadius: 2 }}
        fullWidth
      >
        Quick Analyze
      </Button>
      <Modal open={open} onClose={handleClose}>
        <Box
          sx={{
            ...style,
            borderRadius: 2,
            border: "none",
            width: { xs: "80vw", sm: "60vw", md: "40vw" },
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="h6" sx={{ color: "#0077b6", textAlign: "center" }}>
              Quick Analyzation
            </Typography>

            <TextField
              type="file"
              fullWidth
              variant="outlined"
              onChange={handleFileChange}
            />

            {selectedFile && (
              <Button variant="outlined" color="error" onClick={handleClear}>
                Clear File
              </Button>
            )}

            <Button
              disabled={!selectedFile}
              onClick={handleSubmit}
              variant="contained"
              color="primary"
            >
              Submit
            </Button>

            <Box
              sx={{
                overflowY: "auto",
                p: 2,
                height: "35vh",
                bgcolor: "#90e0ef",
                borderRadius: 2,
                whiteSpace: "pre-wrap",
              }}
            >
              {chat}
            </Box>
          </Box>
        </Box>
      </Modal>
    </div>
  );
}
