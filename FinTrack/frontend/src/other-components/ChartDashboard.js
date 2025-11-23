import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Button
} from '@mui/material';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  LineChart, Line, CartesianGrid,
  ResponsiveContainer
} from 'recharts';

// Sample data (replace with your real data)
// const categoryData = [
//   { name: 'Food', value: 300 },
//   { name: 'Shopping', value: 200 },
//   { name: 'Rent', value: 800 },
// ];

// const vendorData = [
//   { name: 'Amazon', amount: 500 },
//   { name: 'Starbucks', amount: 100 },
//   { name: 'Apple', amount: 300 },
// ];

// const timeSeriesData = [
//   { transaction_date: '2025-04-01', amount: 50 },
//   { transaction_date: '2025-04-02', amount: 70 },
//   { transaction_date: '2025-04-03', amount: 30 },
//   { transaction_date: '2025-04-04', amount: 120 },
// ];

const COLORS = [
        '#0077b6', // deep blue
        '#90e0ef', // light sky blue
        '#00b4d8', // aqua blue
        '#caf0f8', // very light blue
        '#03045e', // navy
        '#48cae4', // soft cyan
        '#0096c7', // bold ocean blue
        '#ade8f4', // ice blue
]

const ChartDashboard = ({transactions, categories, getCategories}) => {
    const [chartType, setChartType] = useState('category_id');
    const [showCurrentMonth, setShowCurrentMonth] = useState(true);

    const handleChange = (_, newType) => {
      if (newType !== null) setChartType(newType);
    };
    const toggleFilter = () => {
        setShowCurrentMonth(prev => !prev);
    };

    // const { categoryData, vendorData, timeSeriesData } = useMemo(() => {
    //   const categoryMap = {};
    //   const vendorMap = {};
    //   const dateMap = {};
    //   transactions.forEach(({ category_id, transaction_name, amount, transaction_date }) => {
    //     // category_id totals
    //     let temp = typeof category_id === 'number' ? getCategories(category_id) : category_id;
    //     categoryMap[temp] = (categoryMap[temp] || 0) + amount;
    //     // Vendor totals
    //     vendorMap[transaction_name] = (vendorMap[transaction_name] || 0) + amount;
    //     // transaction_date totals
    //     const dateStr = new Date(transaction_date).toISOString().split('T')[0]; // Normalize transaction_date
    //     dateMap[dateStr] = (dateMap[dateStr] || 0) + amount;
    //   });
    //   const categoryData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
    //   const vendorData = Object.entries(vendorMap).map(([name, amount]) => ({ name, amount }));
    //   const timeSeriesData = Object.entries(dateMap)
    //     .map(([transaction_date, amount]) => ({ transaction_date, amount }))
    //     .sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date)); // Sort chronologically
    //   return { categoryData, vendorData, timeSeriesData };
    // }, [transactions]);


    const filteredTransactions = useMemo(() => {
      if (!showCurrentMonth) return transactions;

      const now = new Date();
      return transactions.filter(({ transaction_date }) => {
        const txnDate = new Date(transaction_date);
        return txnDate.getMonth() === now.getMonth() && txnDate.getFullYear() === now.getFullYear();
      });
    }, [transactions, showCurrentMonth]);

    // for PieChart
    const categoryData = useMemo(() => {
      const result = {};
      filteredTransactions.forEach(({ category_id, amount }) => {
        let temp = typeof category_id === 'number' ? getCategories(category_id) : category_id;
        result[temp] = (result[temp] || 0) + parseFloat(amount);
      });
      return Object.entries(result).map(([name, value]) => ({ name, value }));
    }, [filteredTransactions]);
    
    // for BarChart
    const vendorData = useMemo(() => {
      const result = {};
      filteredTransactions.forEach(({ transaction_name, amount }) => {
        result[transaction_name] = (result[transaction_name] || 0) + parseFloat(amount);
      });
      return Object.entries(result).map(([name, amount]) => ({ name, amount }));
    }, [filteredTransactions]);
  
    // for LineChart
    const timeSeriesData = useMemo(() => {
      const result = {};
      filteredTransactions.forEach(({ transaction_date, amount }) => {
        const formattedDate = new Date(transaction_date).toISOString().slice(0, 10); // YYYY-MM-DD
        result[formattedDate] = (result[formattedDate] || 0) + parseFloat(amount);
      });
      console.log(result);
    //   console.log(
      return Object.entries(result)
        .sort(([a], [b]) => new Date(a) - new Date(b))
        .map(([date, amount]) => ({ date, amount }));
    }, [filteredTransactions]);

    


    // console.log(categories);
  return (
    <Paper elevation={4} sx={{ p: 3, m: 2 , borderRadius: 2}}>
      <Typography variant="h5" sx={{ mb: 2 , color: COLORS[0]}}>
        Expense Dashboard
      </Typography>

      <ToggleButtonGroup
        value={chartType}
        exclusive
        onChange={handleChange}
        sx={{ mb: 3 }}
      >
        <ToggleButton value="category_id" sx={{color: COLORS[0]}}>By Category</ToggleButton>
        <ToggleButton value="vendor" sx={{color: COLORS[0]}}>By Vendor</ToggleButton>
        <ToggleButton value="timeline" sx={{color: COLORS[0]}}>Over Time</ToggleButton>
      </ToggleButtonGroup>
        {/* <Button variant="outlined" onClick={toggleFilter} sx={{ mb: 2 }}>
            {showCurrentMonth ? 'Show All Time' : 'Show Current Month'}
        </Button> */}
      <Box sx={{ width: '100%', height: 400, pb: 7 }}>
        <Button variant="outlined" onClick={toggleFilter} sx={{ mb: 2 }}>
            {showCurrentMonth ? 'Show All Time' : 'Show Current Month'}
        </Button>
        {chartType === 'category_id' && (
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="value"
                nameKey="name"
                outerRadius={120}
                label={({ name, value }) => `${name}: $${value.toFixed(2)}`}
              >
                {categoryData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`}/>
            </PieChart>
          </ResponsiveContainer>
        )}

        {chartType === 'vendor' && (
          <ResponsiveContainer>
            <BarChart data={vendorData}>
              <XAxis dataKey="name" />
              <YAxis
                tickFormatter={(value) => `$${value}`}
                label={{
                  value: 'Amount ($)',
                  angle: -90,
                  position: 'insideLeft',
                //   dy: 60,
                  style: { textAnchor: 'middle' }
                }}
              />
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`}/>
              <Legend />
              <Bar dataKey="amount" fill="#0077b6" />
            </BarChart>
          </ResponsiveContainer>
        )}

        {chartType === 'timeline' && (
          <ResponsiveContainer>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis
                tickFormatter={(value) => `$${value}`}
                label={{
                  value: 'Amount ($)',
                  angle: -90,
                  position: 'insideLeft',
                //   dy: 60,
                  style: { textAnchor: 'middle' }
                }}
              />
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              <Legend />
              <Line type="monotone" dataKey="amount" stroke="#0077b6" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Box>
    </Paper>
  );
};

export default ChartDashboard;
