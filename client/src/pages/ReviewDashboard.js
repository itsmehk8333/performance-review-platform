import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Flex,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Badge,
  Button,
  Spinner,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Progress,
  Icon,
  Divider,
  Avatar,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Circle,
  Tooltip,
  useColorModeValue
} from '@chakra-ui/react';
import { 
  FiCheckCircle, 
  FiClock, 
  FiAlertTriangle, 
  FiBarChart2, 
  FiUsers, 
  FiArrowRight, 
  FiArrowUpRight,
  FiMessageSquare,
  FiEdit,
  FiThumbsUp
} from 'react-icons/fi';
import { format } from 'date-fns';
import Layout from '../components/Layout';
import { getReviewCycles, getReviews, getPendingApprovals } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const ReviewDashboard = () => {  const [activeCycle, setActiveCycle] = useState(null);
  const [myReviews, setMyReviews] = useState([]);
  const [reviewsAboutMe, setReviewsAboutMe] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, isManager } = useAuth();
  const navigate = useNavigate();
  
  const bgGradient = useColorModeValue(
    'linear(to-r, purple.100, blue.100)',
    'linear(to-r, purple.900, blue.900)'
  );    useEffect(() => {
    // Only fetch dashboard data if user is loaded with a valid ID
    if (user && user.id) {
      console.log("User loaded with ID, fetching dashboard data. User ID:", user.id);
      fetchDashboardData();
    } else {
      console.log("User not fully loaded yet, waiting for authentication...");
    }
  }, [user]); // Add user as a dependency so this runs when user data becomes available
  
  // Add event listener to refresh dashboard when reviews are updated
  useEffect(() => {
    const handleReviewsUpdated = () => {
      console.log("Reviews updated event detected, refreshing dashboard data");
      if (user && user.id) {
        fetchDashboardData();
      }
    };
    
    // Listen for the custom event
    window.addEventListener('reviews-updated', handleReviewsUpdated);
    
    // Clean up
    return () => window.removeEventListener('reviews-updated', handleReviewsUpdated);
  }, [user]);
  
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get active review cycle
      const cyclesResponse = await getReviewCycles();      
      const now = new Date();
      
      const currentCycle = cyclesResponse.data.find(cycle => {
        const startDate = new Date(cycle.startDate);
        const endDate = new Date(cycle.endDate);
        return now >= startDate && now <= endDate;
      }) || cyclesResponse.data[0]; // Fallback to the first cycle if no active cycle
      
      setActiveCycle(currentCycle);
        if (currentCycle) {
        // Get reviews for this cycle
        const reviewsResponse = await getReviews({ cycleId: currentCycle._id });
        
        console.log("All reviews:", reviewsResponse.data);
        console.log("Current cycle:", currentCycle._id);
        console.log("Current user ID:", user.id);
          // Log all reviewers to debug ID matching issues
        console.log("All reviewers:", reviewsResponse.data.map(r => ({
          reviewer_id: r.reviewer._id,
          reviewer_id_string: String(r.reviewer._id),
          user_id: user.id,
          user_id_string: String(user.id),
          isMatch: String(r.reviewer._id) === String(user.id)
        })));        // Enhanced debugging for user and reviewer matching
        console.log("Current user object:", user);
        
        // Split into reviews by me and about me - USE STRING COMPARISON for IDs        // Debug all reviewers and IDs to understand matching issues
        console.log("All reviews data for debugging:");
        reviewsResponse.data.forEach((r, index) => {
          console.log(`Review #${index} (${r._id}):`);
          console.log("  Reviewer:", r.reviewer ? `${r.reviewer.name} (${r.reviewer._id || r.reviewer.id})` : 'undefined');
          console.log("  Reviewee:", r.reviewee ? `${r.reviewee.name} (${r.reviewee._id || r.reviewee.id})` : 'undefined');
          console.log("  Status:", r.status);
          console.log("  Type:", r.type);
        });
        
        // Filter reviews by current user as reviewer
        const reviewsByMe = reviewsResponse.data.filter(r => {
          if (!r.reviewer || (!r.reviewer._id && !r.reviewer.id)) {
            console.log("Invalid reviewer data:", r);
            return false;
          }
          
          // Extract IDs and convert to strings for reliable comparison
          const reviewerId = r.reviewer._id ? String(r.reviewer._id) : (r.reviewer.id ? String(r.reviewer.id) : null);
          const userId = String(user.id);
          
          console.log(`Comparing reviewer ID: ${reviewerId} with user ID: ${userId} - Match: ${reviewerId === userId}`);
          
          // Skip if either ID is missing
          if (!reviewerId) return false;
          
          return reviewerId === userId;
        });
        
        // Filter reviews by current user as reviewee
        const reviewsForMe = reviewsResponse.data.filter(r => {
          if (!r.reviewee || (!r.reviewee._id && !r.reviewee.id)) {
            console.log("Invalid reviewee data:", r);
            return false;
          }
          
          // Extract IDs and convert to strings for reliable comparison
          const revieweeId = r.reviewee._id ? String(r.reviewee._id) : (r.reviewee.id ? String(r.reviewee.id) : null);
          const userId = String(user.id);
          
          console.log(`Comparing reviewee ID: ${revieweeId} with user ID: ${userId} - Match: ${revieweeId === userId}`);
          
          // Skip if reviewee ID is missing
          if (!revieweeId) return false;
          
          return revieweeId === userId;
        });
        
        console.log("Reviews by me:", reviewsByMe);
        console.log("Reviews about me:", reviewsForMe);
        
        setMyReviews(reviewsByMe);
        setReviewsAboutMe(reviewsForMe);
      }
      
      // Get pending approvals for managers
      if (isManager()) {
        try {
          const approvalsResponse = await getPendingApprovals();
          setPendingApprovals(approvalsResponse.data);
        } catch (error) {
          console.error('Error fetching pending approvals:', error);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };
  
  const getReviewTypeBadge = (type) => {
    switch(type) {
      case 'self':
        return <Badge colorScheme="green">Self</Badge>;
      case 'peer':
        return <Badge colorScheme="blue">Peer</Badge>;
      case 'manager':
        return <Badge colorScheme="purple">Manager</Badge>;
      case 'upward':
        return <Badge colorScheme="orange">Upward</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };
  
  const getReviewStatusBadge = (status) => {
    switch(status) {
      case 'submitted':
        return <Badge colorScheme="green">Submitted</Badge>;
      case 'in_progress':
        return <Badge colorScheme="purple">In Progress</Badge>;
      case 'calibrated':
        return <Badge colorScheme="blue">Calibrated</Badge>;
      default:
        return <Badge colorScheme="yellow">Pending</Badge>;
    }
  };
  
  const getPhaseIndicator = (phase, currentPhase) => {
    const phases = ['planning', 'self', 'peer', 'manager', 'upward', 'calibration', 'completed'];
    const phaseIndex = phases.indexOf(phase);
    const currentIndex = phases.indexOf(currentPhase);
    
    let color;
    if (phaseIndex < currentIndex) {
      color = 'green.500';
    } else if (phaseIndex === currentIndex) {
      color = 'blue.500';
    } else {
      color = 'gray.300';
    }
    
    return (
      <Tooltip label={phase.charAt(0).toUpperCase() + phase.slice(1)}>
        <Circle size="30px" bg={color} color="white" mr={1}>
          {phaseIndex + 1}
        </Circle>
      </Tooltip>
    );
  };
  
  if (loading) {
    return (
      <Layout>
        <Flex justify="center" align="center" h="50vh">
          <Spinner size="xl" color="purple.500" />
        </Flex>
      </Layout>
    );
  }
    // Calculate statistics
  const totalAssigned = myReviews.length;
  const completedReviews = myReviews.filter(r => r.status === 'submitted' || r.status === 'calibrated' || r.status === 'approved').length;
  const pendingReviews = totalAssigned - completedReviews;
  const completionPercentage = totalAssigned > 0 ? (completedReviews / totalAssigned) * 100 : 0;
  
  // Calculate feedback about me statistics
  // Check if a review cycle is active and has a status of in_progress or completed
  const isActiveCycle = activeCycle && (activeCycle.status === 'in_progress' || activeCycle.status === 'completed');
  
  // Expected reviews should be all reviews about the user for the active cycle with any status
  const totalFeedbackAboutMe = isActiveCycle ? 
    reviewsAboutMe.filter(r => r.cycleId && r.cycleId._id === activeCycle._id).length : 
    reviewsAboutMe.length;
  
  // Received feedback should be submitted, calibrated, or approved reviews about the user
  const receivedFeedback = reviewsAboutMe.filter(r => 
    (r.status === 'submitted' || r.status === 'calibrated' || r.status === 'approved') &&
    (!isActiveCycle || (r.cycleId && r.cycleId._id === activeCycle._id))
  ).length;
  
  const pendingFeedback = totalFeedbackAboutMe - receivedFeedback;
  const feedbackPercentage = totalFeedbackAboutMe > 0 ? (receivedFeedback / totalFeedbackAboutMe) * 100 : 0;
  
  return (
    <Layout>
      <Box mb={8}>
        <Box p={6} borderRadius="lg" bgGradient={bgGradient} mb={6}>
          <Heading size="lg" mb={2}>Review Dashboard</Heading>
          {activeCycle ? (
            <VStack align="stretch" spacing={3}>
              <HStack>
                <Heading size="md">{activeCycle.name}</Heading>
                <Badge colorScheme="blue" fontSize="sm">
                  {activeCycle.cycleType.charAt(0).toUpperCase() + activeCycle.cycleType.slice(1)}
                </Badge>
              </HStack>
              
              <HStack>
                <Text fontSize="sm">
                  {format(new Date(activeCycle.startDate), 'MMM dd, yyyy')} - {format(new Date(activeCycle.endDate), 'MMM dd, yyyy')}
                </Text>
                <Badge colorScheme="purple">
                  Current Phase: {activeCycle.status.toUpperCase()}
                </Badge>
              </HStack>
              
              <HStack spacing={1} mt={2}>
                {['planning', 'self', 'peer', 'manager', 'upward', 'calibration', 'completed'].map(phase => 
                  getPhaseIndicator(phase, activeCycle.status)
                )}
              </HStack>
            </VStack>
          ) : (
            <Text>No active review cycle</Text>
          )}
        </Box>
        
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={8}>
          <Card>            <CardHeader>
              <Heading size="md">My Reviews to Complete</Heading>
            </CardHeader>
            <CardBody pt={4} pb={6} px={5}>
              <SimpleGrid columns={2} spacing={4} mb={5}>
                <Stat>
                  <Flex align="center">
                    <Box mr={2}>
                      <Icon as={FiClock} color="orange.500" boxSize={6} />
                    </Box>
                    <Box>
                      <StatLabel>Pending</StatLabel>
                      <StatNumber>{pendingReviews}</StatNumber>
                    </Box>
                  </Flex>
                </Stat>
                
                <Stat>
                  <Flex align="center">
                    <Box mr={2}>
                      <Icon as={FiCheckCircle} color="green.500" boxSize={6} />
                    </Box>
                    <Box>
                      <StatLabel>Completed</StatLabel>
                      <StatNumber>{completedReviews}</StatNumber>
                    </Box>
                  </Flex>
                </Stat>
              </SimpleGrid>
                <Box mb={5}>
                <Flex justify="space-between" mb={1}>
                  <Text fontSize="sm">Completion</Text>
                  <Text fontSize="sm" fontWeight="bold">{completionPercentage.toFixed(0)}%</Text>
                </Flex>
                <Progress 
                  value={completionPercentage} 
                  size="sm" 
                  borderRadius="full" 
                  colorScheme={completionPercentage === 100 ? "green" : "blue"} 
                />
              </Box>{pendingReviews > 0 ? (
                <Button 
                  rightIcon={<FiArrowRight />} 
                  colorScheme="blue" 
                  size="md" 
                  width="full"
                  height="48px"
                  onClick={() => navigate('/reviews')}
                >
                  Complete your {pendingReviews} pending review{pendingReviews > 1 ? 's' : ''}
                </Button>
              ) : (
                <Flex 
                  align="center" 
                  justify="center" 
                  bg="green.50" 
                  color="green.700" 
                  p={3} 
                  borderRadius="md"
                  height="48px"
                >
                  <Icon as={FiCheckCircle} mr={2} />
                  <Text>All reviews completed!</Text>
                </Flex>
              )}
            </CardBody>
          </Card>
          
          <Card>            <CardHeader>
              <Heading size="md">Feedback About Me</Heading>
            </CardHeader>
            <CardBody pt={4} pb={6} px={5}>
              <SimpleGrid columns={2} spacing={4} mb={5}>
                <Stat>
                  <Flex align="center">
                    <Box mr={2}>
                      <Icon as={FiMessageSquare} color="blue.500" boxSize={6} />
                    </Box>
                    <Box>
                      <StatLabel>Received</StatLabel>
                      <StatNumber>{receivedFeedback}</StatNumber>
                      <StatHelpText>Completed reviews</StatHelpText>
                    </Box>
                  </Flex>
                </Stat>
                
                <Stat>
                  <Flex align="center">
                    <Box mr={2}>
                      <Icon as={FiUsers} color="purple.500" boxSize={6} />
                    </Box>
                    <Box>
                      <StatLabel>Expected</StatLabel>
                      <StatNumber>{totalFeedbackAboutMe}</StatNumber>
                      <StatHelpText>Total reviews</StatHelpText>
                    </Box>
                  </Flex>
                </Stat>
              </SimpleGrid>
              
              <Box mb={5}>
                <Flex justify="space-between" mb={1}>
                  <Text fontSize="sm">Progress</Text>
                  <Text fontSize="sm" fontWeight="bold">{feedbackPercentage.toFixed(0)}%</Text>
                </Flex>
                <Progress 
                  value={feedbackPercentage}                  size="sm" 
                  borderRadius="full" 
                  colorScheme={feedbackPercentage === 100 ? "green" : "blue"} 
                />
              </Box>
                <Button 
                rightIcon={<FiArrowRight />} 
                colorScheme="blue" 
                size="md" 
                width="full"
                height="48px"
                onClick={() => navigate('/reviews')}
              >
                View my feedback
              </Button>
            </CardBody>
          </Card>
        </SimpleGrid>
        
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          <Card>
            <CardHeader>
              <Heading size="md">My Pending Reviews</Heading>
            </CardHeader>
            <CardBody p={0}>
              {myReviews.filter(r => r.status === 'pending' || r.status === 'in_progress').length > 0 ? (
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Type</Th>
                      <Th>Reviewee</Th>
                      <Th>Status</Th>
                      <Th>Action</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {myReviews
                      .filter(r => r.status === 'pending' || r.status === 'in_progress')
                      .map(review => (
                        <Tr key={review._id}>
                          <Td>{getReviewTypeBadge(review.type)}</Td>
                          <Td>
                            <HStack>
                              <Avatar size="xs" name={review.reviewee.name} />
                              <Text fontSize="sm">{review.reviewee.name}</Text>
                            </HStack>
                          </Td>
                          <Td>{getReviewStatusBadge(review.status)}</Td>
                          <Td>
                            <Button 
                              size="xs" 
                              leftIcon={<FiEdit />} 
                              colorScheme="blue"
                              onClick={() => navigate(`/reviews/${review._id}`)}
                            >
                              Review
                            </Button>
                          </Td>
                        </Tr>
                      ))
                    }
                  </Tbody>
                </Table>
              ) : (
                <Flex direction="column" align="center" justify="center" py={10}>
                  <Icon as={FiCheckCircle} boxSize={10} color="green.400" mb={3} />
                  <Text>All your reviews are complete!</Text>
                </Flex>
              )}
            </CardBody>
          </Card>
          
          <Card>
            <CardHeader>
              <Heading size="md">Recent Feedback For Me</Heading>
            </CardHeader>
            <CardBody p={0}>
              {reviewsAboutMe.filter(r => r.status === 'submitted' || r.status === 'calibrated').length > 0 ? (
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Type</Th>
                      <Th>From</Th>
                      <Th>Status</Th>
                      <Th>Action</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {reviewsAboutMe
                      .filter(r => r.status === 'submitted' || r.status === 'calibrated')
                      .map(review => (
                        <Tr key={review._id}>
                          <Td>{getReviewTypeBadge(review.type)}</Td>
                          <Td>
                            {review.isAnonymous && review.type === 'peer' ? (
                              <Text fontSize="sm" fontStyle="italic">Anonymous</Text>
                            ) : (
                              <HStack>
                                <Avatar size="xs" name={review.reviewer.name} />
                                <Text fontSize="sm">{review.reviewer.name}</Text>
                              </HStack>
                            )}
                          </Td>
                          <Td>{getReviewStatusBadge(review.status)}</Td>
                          <Td>
                            <Button 
                              size="xs" 
                              leftIcon={<FiArrowUpRight />} 
                              colorScheme="purple"
                              onClick={() => navigate(`/reviews/${review._id}`)}
                            >
                              View
                            </Button>
                          </Td>
                        </Tr>
                      ))
                    }
                  </Tbody>
                </Table>
              ) : (
                <Flex direction="column" align="center" justify="center" py={10}>
                  <Icon as={FiAlertTriangle} boxSize={10} color="yellow.400" mb={3} />
                  <Text>No feedback has been submitted yet</Text>
                </Flex>
              )}
            </CardBody>
          </Card>
        </SimpleGrid>
        
        {/* Pending Approvals Section for managers */}
        {isManager() && pendingApprovals.length > 0 && (
          <Card mb={6}>
            <CardHeader>
              <Heading size="md">
                <HStack>
                  <Icon as={FiThumbsUp} />
                  <Text>Pending Approvals</Text>
                </HStack>
              </Heading>
            </CardHeader>
            <CardBody>
              <VStack align="stretch" spacing={4}>
                <Text>You have {pendingApprovals.length} reviews pending your approval.</Text>
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Reviewee</Th>
                      <Th>Reviewer</Th>
                      <Th>Submitted</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {pendingApprovals.map(review => (
                      <Tr key={review._id}>
                        <Td>
                          <HStack>
                            <Avatar size="xs" name={review.reviewee.name} src={review.reviewee.avatar} />
                            <Text>{review.reviewee.name}</Text>
                          </HStack>
                        </Td>
                        <Td>
                          <HStack>
                            <Avatar size="xs" name={review.reviewer.name} src={review.reviewer.avatar} />
                            <Text>{review.reviewer.name}</Text>
                          </HStack>
                        </Td>
                        <Td>{review.submittedAt ? format(new Date(review.submittedAt), 'MMM d, yyyy') : 'N/A'}</Td>
                        <Td>
                          <Button 
                            size="sm" 
                            colorScheme="blue" 
                            leftIcon={<FiArrowRight />}
                            onClick={() => navigate(`/reviews/${review._id}`)}
                          >
                            Review
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </VStack>
            </CardBody>
          </Card>
        )}
      </Box>
    </Layout>
  );
};

export default ReviewDashboard;
