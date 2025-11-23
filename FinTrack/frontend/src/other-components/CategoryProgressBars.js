import React, { useMemo, useEffect }from 'react';
import { Box, Typography, LinearProgress} from '@mui/material';


// const categories = [
//   { name: 'Groceries', value: 320, goal: 500 },
//   { name: 'Utilities', value: 180, goal: 150 },
//   { name: 'Entertainment', value: 220, goal: 300 },
//   { name: 'Transport', value: 180, goal: 200 },
// ];

const CategoryProgressBars = ({transactions, budgets, getCategories}) => {

  // const [categories, setCategories] = useState([]);

  const { categories } = useMemo(() => {
      const categoryMap = {};
      const vendorMap = {};
      const dateMap = {};

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth(); // 0-indexed, January = 0

      const filteredTransactions = transactions.filter(({ transaction_date }) => {
        const date = new Date(transaction_date);
        return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
      });

      budgets.forEach(({ category_id }) => {
        let temp = typeof category_id === 'number' ? getCategories(category_id) : category_id;
        categoryMap[temp] = 0;
      });
      filteredTransactions.forEach(({ category_id, transaction_name, amount, transaction_date }) => {
        // category_id totals
        let temp = typeof category_id === 'number' ? getCategories(category_id) : category_id;
        categoryMap[temp] = categoryMap[temp] + amount;
        // Vendor totals
        vendorMap[transaction_name] = (vendorMap[transaction_name] || 0) + amount;
        // transaction_date totals
        const dateStr = new Date(transaction_date).toISOString().split('T')[0]; // Normalize transaction_date
        dateMap[dateStr] = (dateMap[dateStr] || 0) + amount;
      });
      let categories = Object.entries(categoryMap).map(([name, value]) => ({ "categoryName": name, "value": value, "goal": budgets.find(b => (typeof b.category_id === 'number' ? getCategories(b.category_id) : b.category_id) === name)?.amount || 0 }));
      categories = categories.filter(category => category.goal > 0); // Filter out categories with zero value
      // budgets.forEach
      return { categories };
    }, [transactions, budgets]);


  return (
    <Box sx={{width: "100%"}}>
      <Typography variant="h7" className="blue2" sx={{ mb: 2, fontWeight: 500 }}>
        Category Budgets
      </Typography>
      {categories.map(({ categoryName, value, goal }) => {
        const percent = Math.min((value / goal) * 100, 100);
        return (
          <Box key={categoryName} sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body1">{categoryName}</Typography>
              <Typography variant="body2">${value.toFixed(2)} / ${goal.toFixed(2)}</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={percent}
              sx={{
                height: 10,
                borderRadius: 5,
              }}
            />
          </Box>
        );
      })}
    </Box>
  );
};

export default CategoryProgressBars;
