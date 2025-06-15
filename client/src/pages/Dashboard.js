import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardBody,
  CardHeader,
  HStack,
  Icon,
  Button,
  Progress,
  Badge,
  VStack,
  Divider,
  useColorModeValue
} from '@chakra-ui/react';
import { FiTarget, FiMessageSquare, FiClipboard, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom';
import Layout from '../components/Layout';
import { getGoals, getFeedback, getReviews, getReviewCycles } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const StatCard = ({ icon, label, value, helpText, color }) => {
  return (
    <Card>
      <CardBody>
        <Stat>
          <HStack spacing={4}>
            <Box p={2} bg={`${color}.50`} borderRadius="md">
              <Icon as={icon} boxSize={6} color={`${color}.500`} />
            </Box>
            <Box>
              <StatLabel fontSize="sm">{label}</StatLabel>
              <StatNumber fontSize="2xl">{value}</StatNumber>
              {helpText && <StatHelpText>{helpText}</StatHelpText>}
            </Box>
          </HStack>
        </Stat>
      </CardBody>
    </Card>
  );
};

const GoalCard = ({ goal }) => {
  return (
    <Card>
      <CardBody>
        <HStack justify="space-between" mb={2}>
          <Badge colorScheme={goal.level === 'company' ? 'purple' : goal.level === 'department' ? 'blue' : goal.level === 'team' ? 'green' : 'gray'}>
            {goal.level}
          </Badge>
          <Badge colorScheme={goal.status === 'Completed' ? 'green' : 'yellow'}>
            {goal.status}
          </Badge>
        </HStack>
        <Heading size="md" mb={2} noOfLines={1}>{goal.title}</Heading>
        <Text noOfLines={2} mb={4} fontSize="sm" color="gray.600">
          {goal.description}
        </Text>
        <Text fontSize="xs" mb={1}>Progress: {goal.progress}%</Text>
        <Progress value={goal.progress} size="sm" colorScheme="blue" borderRadius="full" mb={4} />
        <HStack justify="space-between">
          <Text fontSize="xs" color="gray.500">
            Due: {format(new Date(goal.dueDate), 'MMM d, yyyy')}
          </Text>
          <Button as={RouterLink} to={`/goals/${goal._id}`} size="xs" colorScheme="blue" variant="outline">
            View
          </Button>
        </HStack>
      </CardBody>
    </Card>
  );
};

const Dashboard = () => {
  const [goals, setGoals] = useState([]);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [activeCycles, setActiveCycles] = useState([]);
  const { user, isAdmin, isManager } = useAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch goals
        const goalsRes = await getGoals();
        setGoals(goalsRes.data);
        
        // Fetch feedback count
        const feedbackRes = await getFeedback();
        setFeedbackCount(feedbackRes.data.length);
        
        // Fetch reviews count
        const reviewsRes = await getReviews();
        setReviewsCount(reviewsRes.data.length);
        
        // Fetch active review cycles
        const cyclesRes = await getReviewCycles();
        const now = new Date();
        const active = cyclesRes.data.filter(cycle => 
          new Date(cycle.startDate) <= now && new Date(cycle.endDate) >= now
        );
        setActiveCycles(active);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };
    
    fetchDashboardData();
  }, []);

  // Calculate goal completion rate
  const completedGoals = goals.filter(goal => goal.status === 'Completed').length;
  const completionRate = goals.length > 0 ? Math.round((completedGoals / goals.length) * 100) : 0;
  
  // Get recent goals
  const recentGoals = [...goals].sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  ).slice(0, 4);

  return (
    <Layout>
      <Box mb={8}>
        <Heading mb={2}>Dashboard</Heading>
        <Text color="gray.600">Welcome back, {user?.name}</Text>
      </Box>
      
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        <StatCard 
          icon={FiTarget}
          label="Goals"
          value={goals.length}
          helpText={`${completedGoals} completed`}
          color="blue"
        />
        <StatCard 
          icon={FiCheck}
          label="Completion Rate"
          value={`${completionRate}%`}
          color="green"
        />
        <StatCard 
          icon={FiMessageSquare}
          label="Feedback"
          value={feedbackCount}
          color="orange"
        />
        <StatCard 
          icon={FiClipboard}
          label="Reviews"
          value={reviewsCount}
          helpText={`${activeCycles.length} active cycles`}
          color="purple"
        />
      </SimpleGrid>
      
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
        <Box>
          <Card mb={6}>
            <CardHeader>
              <HStack justify="space-between">
                <Heading size="md">Recent Goals</Heading>
                <Button as={RouterLink} to="/goals" size="sm" colorScheme="blue" variant="ghost">
                  View All
                </Button>
              </HStack>
            </CardHeader>
            <CardBody>
              {recentGoals.length > 0 ? (
                <VStack spacing={4} align="stretch">
                  {recentGoals.map(goal => (
                    <GoalCard key={goal._id} goal={goal} />
                  ))}
                </VStack>
              ) : (
                <Box textAlign="center" py={6}>
                  <Icon as={FiTarget} boxSize={10} color="gray.300" mb={3} />
                  <Text color="gray.500">No goals found</Text>
                  <Button 
                    as={RouterLink} 
                    to="/goals/new" 
                    mt={4} 
                    colorScheme="blue"
                  >
                    Create Your First Goal
                  </Button>
                </Box>
              )}
            </CardBody>
          </Card>
        </Box>
        
        <Box>
          <Card mb={6}>
            <CardHeader>
              <Heading size="md">Active Review Cycles</Heading>
            </CardHeader>
            <CardBody>
              {activeCycles.length > 0 ? (
                <VStack spacing={4} align="stretch">
                  {activeCycles.map(cycle => (
                    <Card key={cycle._id} variant="outline">
                      <CardBody>
                        <Heading size="sm" mb={2}>{cycle.name}</Heading>
                        <HStack justify="space-between" fontSize="sm">
                          <Text color="gray.600">
                            {format(new Date(cycle.startDate), 'MMM d')} - {format(new Date(cycle.endDate), 'MMM d, yyyy')}
                          </Text>
                          <Button 
                            as={RouterLink} 
                            to={`/reviews?cycleId=${cycle._id}`} 
                            size="xs" 
                            colorScheme="purple" 
                            variant="outline"
                          >
                            View Reviews
                          </Button>
                        </HStack>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              ) : (
                <Box textAlign="center" py={6}>
                  <Icon as={FiClipboard} boxSize={10} color="gray.300" mb={3} />
                  <Text color="gray.500">No active review cycles</Text>
                  {isAdmin() && (
                    <Button 
                      as={RouterLink} 
                      to="/reviews/cycles/new" 
                      mt={4} 
                      colorScheme="purple"
                    >
                      Create Review Cycle
                    </Button>
                  )}
                </Box>
              )}
            </CardBody>
          </Card>
          
          <Card>
            <CardHeader>
              <HStack justify="space-between">
                <Heading size="md">Recent Feedback</Heading>
                <Button as={RouterLink} to="/feedback" size="sm" colorScheme="blue" variant="ghost">
                  View All
                </Button>
              </HStack>
            </CardHeader>
            <CardBody>
              {feedbackCount > 0 ? (
                <Box>Feedback items would go here</Box>
              ) : (
                <Box textAlign="center" py={6}>
                  <Icon as={FiMessageSquare} boxSize={10} color="gray.300" mb={3} />
                  <Text color="gray.500">No feedback yet</Text>
                  <Button 
                    as={RouterLink} 
                    to="/goals" 
                    mt={4} 
                    colorScheme="orange"
                  >
                    Give Feedback
                  </Button>
                </Box>
              )}
            </CardBody>
          </Card>
        </Box>
      </SimpleGrid>
    </Layout>
  );
};

export default Dashboard;
