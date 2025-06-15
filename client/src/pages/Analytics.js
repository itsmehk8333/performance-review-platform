import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  Flex,
  Spinner,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useColorModeValue,
  Alert,
  AlertIcon,
  Card,
  CardHeader,
  CardBody,
  Icon
} from '@chakra-ui/react';
import { FiClipboard, FiMessageSquare, FiClock } from 'react-icons/fi';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import Layout from '../components/Layout';
import { getReviewVolumeData, getFeedbackFrequencyData } from '../utils/api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Analytics = () => {
  const [reviewVolumeData, setReviewVolumeData] = useState(null);
  const [feedbackFrequencyData, setFeedbackFrequencyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Colors for charts
  const cardBg = useColorModeValue('white', 'gray.700');
  const barColors = [
    'rgba(66, 153, 225, 0.8)',  // blue
    'rgba(159, 122, 234, 0.8)',  // purple
    'rgba(72, 187, 120, 0.8)',   // green
    'rgba(237, 137, 54, 0.8)',   // orange
    'rgba(226, 50, 98, 0.8)'     // pink
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [reviewVolume, feedbackFrequency] = await Promise.all([
          getReviewVolumeData(),
          getFeedbackFrequencyData()
        ]);
        
        setReviewVolumeData(reviewVolume.data);
        setFeedbackFrequencyData(feedbackFrequency.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError('Failed to load analytics data. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Format month names for review volume chart
  const formatMonthData = (data) => {
    if (!data) return { labels: [], datasets: [] };

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const labels = data.map(item => `${monthNames[item._id.month - 1]} ${item._id.year}`);
    
    return {
      labels,
      datasets: [
        {
          label: 'Total Reviews',
          data: data.map(item => item.count),
          borderColor: 'rgba(49, 130, 206, 1)', // blue.500
          backgroundColor: 'rgba(49, 130, 206, 0.2)',
          borderWidth: 2,
          tension: 0.3,
          fill: true,
          pointBackgroundColor: 'rgba(49, 130, 206, 1)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: 'Submitted Reviews',
          data: data.map(item => item.submitted),
          borderColor: 'rgba(72, 187, 120, 1)',  // green.500
          backgroundColor: 'rgba(72, 187, 120, 0.1)',
          borderWidth: 2,
          tension: 0.3,
          fill: false,
          pointBackgroundColor: 'rgba(72, 187, 120, 1)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        }
      ],
    };
  };

  // Format week data for feedback frequency chart
  const formatWeekData = (data) => {
    if (!data) return { labels: [], datasets: [] };
    
    // Sort data by year and week
    const sortedData = [...data].sort((a, b) => {
      if (a._id.year !== b._id.year) return a._id.year - b._id.year;
      return a._id.week - b._id.week;
    });
    
    const labels = sortedData.map(item => `Week ${item._id.week}, ${item._id.year}`);
    
    // Create colorful bar chart
    return {
      labels,
      datasets: [
        {
          label: 'Feedback Count',
          data: sortedData.map(item => item.count),
          backgroundColor: sortedData.map((_, index) => barColors[index % barColors.length]),
          borderColor: 'rgba(255, 255, 255, 0.5)',
          borderWidth: 1,
          borderRadius: 4,
          hoverBackgroundColor: 'rgba(66, 153, 225, 1)',
        }
      ],
    };
  };

  // Calculate summary stats
  const calculateSummaryStats = () => {
    if (!reviewVolumeData || !feedbackFrequencyData) return null;

    const totalReviews = reviewVolumeData.reduce((sum, item) => sum + item.count, 0);
    const submittedReviews = reviewVolumeData.reduce((sum, item) => sum + item.submitted, 0);
    const pendingReviews = reviewVolumeData.reduce((sum, item) => sum + item.pending, 0);
    const completionRate = totalReviews > 0 ? Math.round((submittedReviews / totalReviews) * 100) : 0;
    
    const totalFeedback = feedbackFrequencyData.reduce((sum, item) => sum + item.count, 0);
    const avgFeedbackPerWeek = feedbackFrequencyData.length > 0 
      ? (totalFeedback / feedbackFrequencyData.length).toFixed(1) 
      : 0;

    return {
      totalReviews,
      submittedReviews,
      pendingReviews,
      completionRate,
      totalFeedback,
      avgFeedbackPerWeek
    };
  };

  const stats = calculateSummaryStats();

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      }
    },
    animation: {
      duration: 1500
    }
  };

  return (
    <Layout>
      <Container maxW="container.xl" pt={5}>
        <Heading mb={6}>Analytics Dashboard</Heading>
        
        {error && (
          <Alert status="error" mb={6}>
            <AlertIcon />
            {error}
          </Alert>
        )}
        
        {loading ? (
          <Flex justify="center" align="center" height="200px">
            <Spinner size="xl" color="brand.500" />
          </Flex>
        ) : (
          <>
            {/* Summary Stats */}
            {stats && (
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
                <Card 
                  bg={cardBg} 
                  shadow="md" 
                  borderTop="4px solid" 
                  borderColor="blue.500"
                >
                  <CardHeader pb={0}>
                    <Flex align="center">
                      <Box 
                        bg="blue.500" 
                        p={2} 
                        borderRadius="md" 
                        mr={3}
                      >
                        <Icon 
                          as={FiClipboard} 
                          color="white" 
                          boxSize={5} 
                        />
                      </Box>
                      <Heading size="md" color="blue.500">Review Completion</Heading>
                    </Flex>
                  </CardHeader>
                  <CardBody>
                    <Stat>
                      <StatLabel fontSize="md">Completion Rate</StatLabel>
                      <StatNumber fontSize="3xl" fontWeight="bold" color="blue.500">
                        {stats.completionRate}%
                      </StatNumber>
                      <StatHelpText>
                        {stats.submittedReviews} of {stats.totalReviews} reviews completed
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
                
                <Card 
                  bg={cardBg} 
                  shadow="md" 
                  borderTop="4px solid" 
                  borderColor="orange.500"
                >
                  <CardHeader pb={0}>
                    <Flex align="center">
                      <Box 
                        bg="orange.500" 
                        p={2} 
                        borderRadius="md" 
                        mr={3}
                      >
                        <Icon 
                          as={FiClock} 
                          color="white" 
                          boxSize={5} 
                        />
                      </Box>
                      <Heading size="md" color="orange.500">Pending Reviews</Heading>
                    </Flex>
                  </CardHeader>
                  <CardBody>
                    <Stat>
                      <StatLabel fontSize="md">Reviews Awaiting Completion</StatLabel>
                      <StatNumber fontSize="3xl" fontWeight="bold" color="orange.500">
                        {stats.pendingReviews}
                      </StatNumber>
                      <StatHelpText>
                        {stats.pendingReviews > 0 
                          ? `${Math.round((stats.pendingReviews / stats.totalReviews) * 100)}% of total reviews`
                          : 'No pending reviews'}
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
                
                <Card 
                  bg={cardBg} 
                  shadow="md" 
                  borderTop="4px solid" 
                  borderColor="green.500"
                >
                  <CardHeader pb={0}>
                    <Flex align="center">
                      <Box 
                        bg="green.500" 
                        p={2} 
                        borderRadius="md" 
                        mr={3}
                      >
                        <Icon 
                          as={FiMessageSquare} 
                          color="white" 
                          boxSize={5} 
                        />
                      </Box>
                      <Heading size="md" color="green.500">Feedback Activity</Heading>
                    </Flex>
                  </CardHeader>
                  <CardBody>
                    <Stat>
                      <StatLabel fontSize="md">Weekly Average</StatLabel>
                      <StatNumber fontSize="3xl" fontWeight="bold" color="green.500">
                        {stats.avgFeedbackPerWeek}
                      </StatNumber>
                      <StatHelpText>
                        {stats.totalFeedback} total feedback items
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
              </SimpleGrid>
            )}

            {/* Charts */}
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
              <Box 
                bg={cardBg} 
                p={6} 
                borderRadius="lg" 
                shadow="md" 
                height="400px"
                position="relative"
                overflow="hidden"
                _before={{
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '5px',
                  background: 'linear-gradient(to right, #3182ce, #805AD5)'
                }}
              >
                <Line 
                  data={formatMonthData(reviewVolumeData)} 
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      title: {
                        display: true,
                        text: 'Review Volume Trends (Monthly)',
                        font: { size: 16 }
                      }
                    }
                  }}
                />
              </Box>
              <Box 
                bg={cardBg} 
                p={6} 
                borderRadius="lg" 
                shadow="md" 
                height="400px"
                position="relative"
                overflow="hidden"
                _before={{
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '5px',
                  background: 'linear-gradient(to right, #3182ce, #00A3C4)'
                }}
              >
                <Bar 
                  data={formatWeekData(feedbackFrequencyData)} 
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      title: {
                        display: true,
                        text: 'Feedback Frequency (Weekly)',
                        font: { size: 16 }
                      }
                    }
                  }}
                />
              </Box>
            </SimpleGrid>
          </>
        )}
      </Container>
    </Layout>
  );
};

export default Analytics;
