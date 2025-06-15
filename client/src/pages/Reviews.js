import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  CardBody,
  CardHeader,
  Badge,
  Button,
  Spinner,
  Flex,
  Select,
  FormControl,
  FormLabel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  Input,
  useDisclosure,
  useToast,
  SimpleGrid,
  Icon,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Divider,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Textarea,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Avatar,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { FiCalendar, FiClipboard, FiDownload, FiPlusCircle, FiUsers, FiFileText, FiRefreshCw, FiZap } from 'react-icons/fi';
import { format } from 'date-fns';
import Layout from '../components/Layout';
import { 
  getReviewCycles, 
  createReviewCycle, 
  getReviews, 
  assignReviews, 
  submitReview, 
  exportReviews,
  getReviewTemplates,
  updateReviewCycle,
  advanceReviewCycle,
  generateReviewDraft
} from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

const Reviews = () => {
  const [cycles, setCycles] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedCycle, setSelectedCycle] = useState('');
  const [selectedReviewType, setSelectedReviewType] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [loading, setLoading] = useState(true);
  const [cycleFormData, setCycleFormData] = useState({
    name: '',
    startDate: '',
    endDate: ''
  });
  const [assignFormData, setAssignFormData] = useState({
    cycleId: '',
    reviewTypes: [],
    templateId: ''
  });
  const [reviewFormData, setReviewFormData] = useState({
    content: '',
    ratings: {
      'Communication': 0,
      'Technical Skills': 0,
      'Teamwork': 0,
      'Leadership': 0,
      'Problem Solving': 0
    }
  });
  const [selectedReview, setSelectedReview] = useState(null);
  const [generatingDraft, setGeneratingDraft] = useState(false);
  
  const newCycleModal = useDisclosure();
  const assignReviewsModal = useDisclosure();
  const submitReviewModal = useDisclosure();
    const { user, isAdmin, isManager } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchCycles();
    fetchTemplates();
  }, []);    useEffect(() => {
    // Only fetch reviews if we have a selected cycle AND user data is loaded
    if (selectedCycle && user && user.id) {
      fetchReviews(selectedCycle, selectedReviewType, selectedTemplate);
    }
  }, [selectedCycle, selectedReviewType, selectedTemplate, user]);
    const fetchCycles = async () => {
    try {
      setLoading(true);
      const res = await getReviewCycles();
      setCycles(res.data);
      
      // If cycles exist, select the most recent one
      if (res.data.length > 0) {
        const sortedCycles = [...res.data].sort((a, b) => 
          new Date(b.startDate) - new Date(a.startDate)
        );
        setSelectedCycle(sortedCycles[0]._id);
        
        // If this cycle has a template, select it
        if (sortedCycles[0].templateId) {
          setSelectedTemplate(sortedCycles[0].templateId);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching review cycles:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch review cycles',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setLoading(false);
    }
  };    const fetchReviews = async (cycleId, type = '', templateId = '') => {
    try {
      setLoading(true);
      // Only fetch reviews if we have a valid user
      if (!user || !user.id) {
        setLoading(false);
        return;
      }

      const params = { cycleId };
      if (type) params.type = type;
      if (templateId) params.templateId = templateId;
      
      const res = await getReviews(params);
      
      setReviews(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch reviews',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setLoading(false);
    }
  };
  
  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await getReviewTemplates();
      setTemplates(res.data);
      
      // If templates exist, select the default one if any, otherwise the first one
      if (res.data.length > 0) {
        const defaultTemplate = res.data.find(template => template.isDefault);
        setSelectedTemplate(defaultTemplate ? defaultTemplate._id : res.data[0]._id);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching review templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch review templates',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setLoading(false);
    }
  };
  
  const handleCreateCycle = async () => {
    try {
      // Validate form
      if (!cycleFormData.name || !cycleFormData.startDate || !cycleFormData.endDate) {
        toast({
          title: 'Missing fields',
          description: 'Please fill out all required fields',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      // Check if start date is before end date
      if (new Date(cycleFormData.startDate) >= new Date(cycleFormData.endDate)) {
        toast({
          title: 'Invalid dates',
          description: 'Start date must be before end date',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      // Create review cycle
      await createReviewCycle(cycleFormData);
      
      // Reset form and close modal
      setCycleFormData({
        name: '',
        startDate: '',
        endDate: ''
      });
      newCycleModal.onClose();
      
      // Refresh cycles
      await fetchCycles();
      
      toast({
        title: 'Review cycle created',
        description: 'Your review cycle has been created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error creating review cycle:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.msg || 'Failed to create review cycle',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  const handleAssignReviews = async () => {
    try {
      console.log("Current assignFormData:", assignFormData);
      
      // Validate form
      if (!assignFormData.cycleId) {
        toast({
          title: 'Missing review cycle',
          description: 'Please select a review cycle',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      if (assignFormData.reviewTypes.length === 0) {
        toast({
          title: 'Missing review types',
          description: 'Please select at least one review type (self, peer, manager, or upward)',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      if (!assignFormData.templateId) {
        toast({
          title: 'Missing template',
          description: 'Please select a review template',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      // Check if the selected cycle has a template assigned
      const selectedCycleObj = cycles.find(c => c._id === assignFormData.cycleId);      if (!selectedCycleObj.templateId) {
        toast({
          title: 'Template not assigned to cycle',
          description: 'Please assign a template to this cycle first using the "Assign" button in the Review Template section',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      
      // Assign reviews
      const res = await assignReviews(assignFormData);
      
      // Reset form and close modal
      setAssignFormData({
        cycleId: '',
        reviewTypes: [],
        templateId: ''
      });
      assignReviewsModal.onClose();
      
      // Refresh reviews if current cycle is the one we just assigned for
      if (selectedCycle === assignFormData.cycleId) {
        await fetchReviews(selectedCycle, selectedReviewType);
      }
      
      toast({
        title: 'Reviews assigned',
        description: res.data.msg,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error assigning reviews:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.msg || 'Failed to assign reviews',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  const handleOpenSubmitReview = (review) => {
    setSelectedReview(review);
    setReviewFormData({
      content: '',
      ratings: {
        'Communication': 0,
        'Technical Skills': 0,
        'Teamwork': 0,
        'Leadership': 0,
        'Problem Solving': 0
      }
    });
    submitReviewModal.onOpen();
  };
  
  const handleSubmitReview = async () => {
    try {
      if (!reviewFormData.content) {
        toast({
          title: 'Missing content',
          description: 'Please provide review content',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      // Submit review
      await submitReview(selectedReview._id, reviewFormData);
      
      // Reset form and close modal
      setReviewFormData({
        content: '',
        ratings: {
          'Communication': 0,
          'Technical Skills': 0,
          'Teamwork': 0,
          'Leadership': 0,
          'Problem Solving': 0
        }
      });
      setSelectedReview(null);
      submitReviewModal.onClose();
      
      // Refresh reviews
      await fetchReviews(selectedCycle, selectedReviewType);
      
      toast({
        title: 'Review submitted',
        description: 'Your review has been submitted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.msg || 'Failed to submit review',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  const handleExport = async (format) => {
    try {
      const params = { format };
      if (selectedCycle) params.cycleId = selectedCycle;
      if (selectedReviewType) params.type = selectedReviewType;
      
      const res = await exportReviews(params);
      
      // Create blob and download
      const blob = new Blob([res.data], {
        type: format === 'pdf' ? 'application/pdf' : 'text/csv'
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reviews-export.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      
      toast({
        title: 'Export successful',
        description: `Reviews exported as ${format.toUpperCase()}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error exporting reviews:', error);
      toast({
        title: 'Export failed',
        description: 'Unable to export reviews',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };    const handleRatingChange = (competency, value) => {
    setReviewFormData(prev => {
      const newRatings = {
        ...prev.ratings,
        [competency]: parseInt(value)
      };
      return {
        ...prev,
        ratings: newRatings
      };
    });
  };
  
  const handleGenerateDraft = async (review) => {
    try {
      if (!review || !review.reviewee) {
        toast({
          title: 'Missing reviewee information',
          description: 'Cannot generate draft without reviewee information',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      setGeneratingDraft(true);
      
      const revieweeId = typeof review.reviewee === 'object' ? 
        (review.reviewee._id || review.reviewee.id) : 
        review.reviewee;
      
      const response = await generateReviewDraft({
        revieweeId,
        reviewType: review.type || 'peer',
        cycleId: review.cycleId || review.cycle
      });
      
      // Update form data with the generated draft
      setReviewFormData(prev => ({
        ...prev,
        content: response.data.draft
      }));
      
      toast({
        title: 'Draft generated',
        description: 'A draft review has been generated. Feel free to edit it before submitting.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error generating draft review:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.msg || 'Failed to generate draft review',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setGeneratingDraft(false);
    }
  };
  
  const handleReviewTypeToggle = (type) => {
    setAssignFormData(prev => {
      const types = [...prev.reviewTypes];
      
      if (types.includes(type)) {
        return {
          ...prev,
          reviewTypes: types.filter(t => t !== type)
        };
      } else {
        return {
          ...prev,
          reviewTypes: [...types, type]
        };
      }
    });
  };
  
  const getCurrentCycle = () => {
    if (!selectedCycle || cycles.length === 0) return null;
    return cycles.find(cycle => cycle._id === selectedCycle);
  };
  
  const isCurrentCycleActive = () => {
    const cycle = getCurrentCycle();
    if (!cycle) return false;
    
    const now = new Date();
    const startDate = new Date(cycle.startDate);
    const endDate = new Date(cycle.endDate);
    
    return now >= startDate && now <= endDate;
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
    const [assigningTemplate, setAssigningTemplate] = useState(false);
  
  // Function to assign a template to a review cycle
  const handleAssignTemplateToCycle = async () => {
    try {
      if (!selectedCycle || !selectedTemplate) {
        toast({
          title: 'Missing selections',
          description: 'Please select both a review cycle and template',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      setAssigningTemplate(true);
      await updateReviewCycle(selectedCycle, { templateId: selectedTemplate });
      
      // Refresh cycles to show the updated template assignment
      await fetchCycles();
      
      toast({
        title: 'Template assigned',
        description: 'The template has been assigned to the review cycle',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setAssigningTemplate(false);
    } catch (error) {
      console.error('Error assigning template to cycle:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.msg || 'Failed to assign template to cycle',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setAssigningTemplate(false);
    }
  };
  // State for confirmation dialog
  const [showAdvanceConfirmation, setShowAdvanceConfirmation] = useState(false);
  const [advancingCycle, setAdvancingCycle] = useState(false);
  
  const handleAdvanceCycle = async () => {
    try {
      if (!selectedCycle) {
        toast({
          title: 'No cycle selected',
          description: 'Please select a review cycle to advance',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Get current cycle to check status
      const selectedCycleObj = cycles.find(c => c._id === selectedCycle);
      if (!selectedCycleObj) {
        toast({
          title: 'Error',
          description: 'Could not find selected cycle',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Open confirmation dialog
      setShowAdvanceConfirmation(true);
    } catch (error) {
      console.error('Error preparing to advance cycle:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.msg || 'Failed to prepare cycle advancement',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  const confirmAdvanceCycle = async () => {
    try {
      setAdvancingCycle(true);
      const selectedCycleObj = cycles.find(c => c._id === selectedCycle);
      
      const res = await advanceReviewCycle(selectedCycle);
      
      // Refresh cycles to get updated status
      await fetchCycles();
      
      toast({
        title: 'Cycle advanced',
        description: res.data.msg,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      setShowAdvanceConfirmation(false);
      setAdvancingCycle(false);
    } catch (error) {
      console.error('Error advancing cycle:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.msg || 'Failed to advance cycle',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setAdvancingCycle(false);
    }
  };
  
  const handleRefresh = async () => {
    if (selectedCycle) {
      toast({
        title: 'Refreshing...',
        status: 'info',
        duration: 1000,
        isClosable: true,
      });
      await fetchReviews(selectedCycle, selectedReviewType, selectedTemplate);
    }
  };
  
  return (
    <Layout>
      <Box mb={8}>
        <Flex justify="space-between" align="center" mb={6}>
          <Heading>Performance Reviews</Heading>          <HStack>            {isAdmin() && (
              <Button 
                leftIcon={<FiCalendar />} 
                onClick={newCycleModal.onOpen}
              >
                New Cycle
              </Button>
            )}
            {(isAdmin() || isManager()) && (
              <>
                <Button 
                  leftIcon={<FiUsers />} 
                  onClick={assignReviewsModal.onOpen}
                  colorScheme="purple"
                >
                  Assign Reviews
                </Button>
                <Button
                  onClick={handleAdvanceCycle}
                  colorScheme="blue"
                >
                  Advance Cycle Phase
                </Button>
              </>
            )}            <Button
              onClick={handleRefresh}
              colorScheme="teal"
              leftIcon={<FiRefreshCw />}
              mr={2}
            >
              Refresh
            </Button>
            <Menu>
              <MenuButton as={Button} rightIcon={<ChevronDownIcon />} leftIcon={<FiDownload />}>
                Export
              </MenuButton>
              <MenuList>
                <MenuItem onClick={() => handleExport('csv')}>Export as CSV</MenuItem>
                <MenuItem onClick={() => handleExport('pdf')}>Export as PDF</MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </Flex>
        
        <Card mb={6}>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>                <FormControl>
                <FormLabel>Review Cycle</FormLabel>
                <Select 
                  value={selectedCycle} 
                  onChange={(e) => setSelectedCycle(e.target.value)}
                  placeholder="Select review cycle"
                >
                  {cycles.map(cycle => (
                    <option key={cycle._id} value={cycle._id}>
                      {cycle.name} ({format(new Date(cycle.startDate), 'MMM d')} - {format(new Date(cycle.endDate), 'MMM d, yyyy')}) 
                      [Phase: {cycle.status}]
                    </option>
                  ))}
                </Select>
                {selectedCycle && (
                  <Text mt={1} fontSize="sm" color="gray.500">
                    Current phase: <Badge colorScheme="blue">{cycles.find(c => c._id === selectedCycle)?.status || 'unknown'}</Badge>
                  </Text>
                )}
              </FormControl>
              
              <FormControl>
                <FormLabel>Review Type</FormLabel>
                <Select 
                  value={selectedReviewType} 
                  onChange={(e) => setSelectedReviewType(e.target.value)}
                  placeholder="All review types"
                >
                  <option value="self">Self Assessment</option>
                  <option value="peer">Peer Review</option>
                  <option value="manager">Manager Review</option>
                  <option value="upward">Upward Review</option>
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel>
                  Review Template 
                  {(isAdmin() || isManager()) && (
                    <Button 
                      as={RouterLink} 
                      to="/reviews/templates" 
                      variant="link" 
                      size="sm" 
                      colorScheme="purple" 
                      ml={2}
                    >
                      Manage Templates
                    </Button>
                  )}
                </FormLabel>
                <Flex>
                  <Select 
                    value={selectedTemplate} 
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    placeholder="Select review template"
                    mr={2}
                  >
                    {templates.map(template => (
                      <option key={template._id} value={template._id}>
                        {template.name}
                      </option>
                    ))}
                  </Select>
                  {(isAdmin() || isManager()) && (                    <Button 
                      onClick={handleAssignTemplateToCycle}
                      colorScheme="green"
                      size="md"
                      isLoading={assigningTemplate}
                      loadingText="Assigning"
                    >
                      Assign
                    </Button>
                  )}
                </Flex>
              </FormControl>
                {/* Additional guidance for users */}
              {cycles.length > 0 && (
                <Box mt={4} p={2} bg="blue.50" borderRadius="md">
                  <Text fontWeight="bold">Current Phase: <Badge colorScheme="blue">{cycles.find(c => c._id === selectedCycle)?.status || 'unknown'}</Badge></Text>
                  <Text fontSize="sm" mt={1}>
                    {cycles.find(c => c._id === selectedCycle)?.status === 'planning' && 'Reviews are being planned. You will be notified when it\'s time to complete your reviews.'}
                    {cycles.find(c => c._id === selectedCycle)?.status === 'self' && 'Self-assessment phase is active. Complete your self-review.'}
                    {cycles.find(c => c._id === selectedCycle)?.status === 'peer' && 'Peer review phase is active. Complete reviews for your colleagues.'}
                    {cycles.find(c => c._id === selectedCycle)?.status === 'manager' && 'Manager review phase is active.'}
                    {cycles.find(c => c._id === selectedCycle)?.status === 'upward' && 'Upward review phase is active. Provide feedback for your manager.'}
                    {cycles.find(c => c._id === selectedCycle)?.status === 'calibration' && 'Reviews are being calibrated by management.'}
                    {cycles.find(c => c._id === selectedCycle)?.status === 'completed' && 'This review cycle has been completed.'}
                  </Text>
                </Box>
              )}
            </SimpleGrid>
          </CardBody>
        </Card>
        
        <Tabs variant="enclosed" colorScheme="purple">
          <TabList>
            <Tab>My Reviews to Complete</Tab>
            <Tab>Reviews About Me</Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel p={0} pt={4}>              {loading ? (
                <Flex justify="center" align="center" my={10}>
                  <Spinner size="xl" color="purple.500" />
                </Flex>              ) : reviews.filter(r => {
                // Check if the user is the reviewer AND the review is pending
                // We need to handle both cases where reviewer might be a string ID or an object with _id
                if (!r.reviewer || !user || !user.id) return false;
                
                // Ensure we compare string IDs consistently
                const reviewerId = typeof r.reviewer === 'object' ? 
                  (r.reviewer._id ? String(r.reviewer._id) : (r.reviewer.id ? String(r.reviewer.id) : null)) : 
                  String(r.reviewer);
                const userId = String(user.id);
                
                return reviewerId === userId && r.status === 'pending';
              }).length > 0 ? (
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Type</Th>
                      <Th>Reviewee</Th>
                      <Th>Status</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>                    {reviews
                      .filter(r => {
                        // Check if the user is the reviewer AND the review is pending
                        if (!r.reviewer || !user || !user.id) return false;
                        
                        // Ensure we compare string IDs consistently
                        const reviewerId = typeof r.reviewer === 'object' ? 
                          (r.reviewer._id ? String(r.reviewer._id) : (r.reviewer.id ? String(r.reviewer.id) : null)) : 
                          String(r.reviewer);
                        const userId = String(user.id);
                        
                        return reviewerId === userId && r.status === 'pending';
                      })
                      .map(review => (
                        <Tr 
                          key={review._id}
                          cursor="pointer"
                          _hover={{ bg: 'gray.50' }}
                          onClick={() => navigate(`/reviews/${review._id}`)}
                          aria-label={`Review for ${review.reviewee.name}, type: ${review.type}`}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              navigate(`/reviews/${review._id}`);
                            }
                          }}
                        >
                          <Td>{getReviewTypeBadge(review.type)}</Td>
                          <Td>
                            <HStack>
                              <Avatar size="sm" name={review.reviewee.name} />
                              <Text>{review.reviewee.name}</Text>
                            </HStack>
                          </Td>
                          <Td>
                            <Badge colorScheme="yellow">Pending</Badge>
                          </Td>
                          <Td>                            <Button 
                              size="sm" 
                              colorScheme="purple" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenSubmitReview(review);
                              }}
                              aria-label={`Submit review for ${review.reviewee.name}`}
                            >
                              Submit Review
                            </Button>
                          </Td>
                        </Tr>
                      ))
                    }
                  </Tbody>
                </Table>
              ) : (                <Box textAlign="center" py={10}>
                  <Icon as={FiFileText} boxSize={10} color="gray.300" mb={3} />
                  <Text fontSize="xl" mb={4}>No pending reviews to complete</Text>
                  <Text color="gray.500">
                    {cycles.length === 0 
                      ? "No review cycles have been created yet" 
                      : isAdmin() || isManager() 
                        ? "Use the 'Assign Reviews' button above to create review assignments" 
                        : "No reviews have been assigned to you for this cycle and type. The current review phase is " + 
                          (cycles.find(c => c._id === selectedCycle)?.status || "unknown") + "."}
                  </Text>
                  {!isAdmin() && !isManager() && cycles.find(c => c._id === selectedCycle)?.status === 'self' && (
                    <Alert status="info" maxW="md" mx="auto" mt={4}>
                      <AlertIcon />
                      <Text fontSize="sm">During the self-assessment phase, you should complete your self-review.</Text>
                    </Alert>
                  )}
                </Box>
              )}
            </TabPanel>
            
            <TabPanel p={0} pt={4}>
              {loading ? (
                <Flex justify="center" align="center" my={10}>
                  <Spinner size="xl" color="purple.500" />
                </Flex>              ) : reviews.filter(r => {
                if (!r.reviewee || !user || !user.id) return false;
                // Ensure we compare string IDs consistently
                const revieweeId = typeof r.reviewee === 'object' ? 
                  (r.reviewee._id ? String(r.reviewee._id) : (r.reviewee.id ? String(r.reviewee.id) : null)) : 
                  String(r.reviewee);
                const userId = String(user.id);
                
                return revieweeId === userId;
              }).length > 0 ? (
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Type</Th>
                      <Th>Reviewer</Th>
                      <Th>Status</Th>
                    </Tr>
                  </Thead>
                  <Tbody>                    {reviews
                      .filter(r => {
                        if (!r.reviewee || !user || !user.id) return false;
                        // Ensure we compare string IDs consistently
                        const revieweeId = typeof r.reviewee === 'object' ? 
                          (r.reviewee._id ? String(r.reviewee._id) : (r.reviewee.id ? String(r.reviewee.id) : null)) : 
                          String(r.reviewee);
                        const userId = String(user.id);
                        return revieweeId === userId;
                      })
                      .map(review => (
                        <Tr 
                          key={review._id}
                          cursor="pointer"
                          _hover={{ bg: 'gray.50' }}
                          onClick={() => navigate(`/reviews/${review._id}`)}
                          aria-label={`Review from ${review.type === 'self' ? 'yourself' : review.reviewer.name}, type: ${review.type}, status: ${review.status}`}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              navigate(`/reviews/${review._id}`);
                            }
                          }}
                        >
                          <Td>{getReviewTypeBadge(review.type)}</Td>
                          <Td>
                            {review.type === 'self' ? (
                              <Text>Self</Text>
                            ) : (
                              <HStack>
                                <Avatar size="sm" name={review.reviewer.name} />
                                <Text>{review.reviewer.name}</Text>
                              </HStack>
                            )}
                          </Td>
                          <Td>
                            <Badge colorScheme={review.status === 'submitted' ? 'green' : 'yellow'}>
                              {review.status === 'submitted' ? 'Submitted' : 'Pending'}
                            </Badge>
                          </Td>
                        </Tr>
                      ))
                    }
                  </Tbody>
                </Table>
              ) : (                <Box textAlign="center" py={10}>
                  <Icon as={FiFileText} boxSize={10} color="gray.300" mb={3} />
                  <Text fontSize="xl" mb={4}>No reviews about you yet</Text>
                  <Text color="gray.500">
                    {cycles.length === 0 
                      ? "No review cycles have been created yet"
                      : isAdmin() || isManager() 
                        ? "Use the 'Assign Reviews' button above to create feedback assignments" 
                        : "No reviews have been submitted about you for this cycle. This could be because: "}
                  </Text>
                  {!isAdmin() && !isManager() && cycles.length > 0 && (
                    <VStack spacing={2} maxW="md" mx="auto" mt={4}>
                      <Text color="gray.500" fontSize="sm">• The current phase doesn't include reviews about you yet</Text>
                      <Text color="gray.500" fontSize="sm">• Your colleagues haven't submitted their reviews</Text>
                      <Text color="gray.500" fontSize="sm">• No one has been assigned to review you</Text>
                      <Alert status="info" w="full" mt={2}>
                        <AlertIcon />
                        <Text fontSize="sm">Current phase: <Badge colorScheme="blue">{cycles.find(c => c._id === selectedCycle)?.status || 'unknown'}</Badge></Text>
                      </Alert>
                    </VStack>
                  )}
                </Box>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
      
      {/* New Cycle Modal */}
      <Modal isOpen={newCycleModal.isOpen} onClose={newCycleModal.onClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Review Cycle</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={4} isRequired>
              <FormLabel>Cycle Name</FormLabel>
              <Input 
                placeholder="e.g. Q2 2025"
                value={cycleFormData.name}
                onChange={(e) => setCycleFormData({...cycleFormData, name: e.target.value})}
              />
            </FormControl>
            
            <FormControl mb={4} isRequired>
              <FormLabel>Start Date</FormLabel>
              <Input 
                type="date"
                value={cycleFormData.startDate}
                onChange={(e) => setCycleFormData({...cycleFormData, startDate: e.target.value})}
              />
            </FormControl>
            
            <FormControl mb={4} isRequired>
              <FormLabel>End Date</FormLabel>
              <Input 
                type="date"
                value={cycleFormData.endDate}
                onChange={(e) => setCycleFormData({...cycleFormData, endDate: e.target.value})}
              />
            </FormControl>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={newCycleModal.onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleCreateCycle}>
              Create Cycle
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Assign Reviews Modal */}
      <Modal isOpen={assignReviewsModal.isOpen} onClose={assignReviewsModal.onClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Assign Reviews</ModalHeader>
          <ModalCloseButton />          <ModalBody>
            <Alert status="info" mb={4} fontSize="sm">
              <AlertIcon />
              <Box>
                <Text fontWeight="bold">Review Assignment Process</Text>
                <Text>
                  This will create review assignments for all users based on the selected review types.
                  Make sure the cycle has a template assigned before proceeding.
                </Text>
              </Box>
            </Alert>
            <FormControl mb={4} isRequired>
              <FormLabel>Review Cycle</FormLabel>
              <Select 
                placeholder="Select review cycle"
                value={assignFormData.cycleId}
                onChange={(e) => setAssignFormData({...assignFormData, cycleId: e.target.value})}
              >
                {cycles.map(cycle => (
                  <option key={cycle._id} value={cycle._id}>
                    {cycle.name} ({format(new Date(cycle.startDate), 'MMM d')} - {format(new Date(cycle.endDate), 'MMM d, yyyy')})
                    {cycle.templateId ? ' ✓' : ' (no template assigned)'}
                  </option>
                ))}
              </Select>
            </FormControl>
            
            <FormControl mb={4} isRequired>
              <FormLabel>Review Types</FormLabel>
              <VStack align="start" spacing={2}>
                <HStack>
                  <Button 
                    size="sm" 
                    colorScheme={assignFormData.reviewTypes.includes('self') ? 'green' : 'gray'} 
                    onClick={() => handleReviewTypeToggle('self')}
                  >
                    Self Assessment
                  </Button>
                  <Button 
                    size="sm" 
                    colorScheme={assignFormData.reviewTypes.includes('peer') ? 'blue' : 'gray'} 
                    onClick={() => handleReviewTypeToggle('peer')}
                  >
                    Peer Review
                  </Button>
                </HStack>
                <HStack>
                  <Button 
                    size="sm" 
                    colorScheme={assignFormData.reviewTypes.includes('manager') ? 'purple' : 'gray'} 
                    onClick={() => handleReviewTypeToggle('manager')}
                  >
                    Manager Review
                  </Button>
                  <Button 
                    size="sm" 
                    colorScheme={assignFormData.reviewTypes.includes('upward') ? 'orange' : 'gray'} 
                    onClick={() => handleReviewTypeToggle('upward')}
                  >
                    Upward Review
                  </Button>
                </HStack>
              </VStack>
            </FormControl>
            
            <FormControl mb={4} isRequired>
              <FormLabel>Review Template</FormLabel>
              <Select 
                placeholder="Select review template"
                value={assignFormData.templateId}
                onChange={(e) => setAssignFormData({...assignFormData, templateId: e.target.value})}
              >
                {templates.map(template => (
                  <option key={template._id} value={template._id}>
                    {template.name}
                  </option>
                ))}
              </Select>
            </FormControl>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={assignReviewsModal.onClose}>
              Cancel
            </Button>
            <Button colorScheme="purple" onClick={handleAssignReviews}>
              Assign Reviews
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Submit Review Modal */}
      <Modal isOpen={submitReviewModal.isOpen} onClose={submitReviewModal.onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedReview && (
              <Flex align="center">
                <Text>Review for </Text>
                <Text ml={1} fontWeight="bold">{selectedReview?.reviewee.name}</Text>
                <Box ml={2}>{selectedReview && getReviewTypeBadge(selectedReview.type)}</Box>
              </Flex>
            )}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={6} isRequired>
              <FormLabel>Review Content</FormLabel>              <Textarea 
                placeholder="Provide your detailed feedback..."
                value={reviewFormData.content}
                onChange={(e) => setReviewFormData({...reviewFormData, content: e.target.value})}
                rows={8}
              />
              
              <Button
                leftIcon={<FiZap />}
                colorScheme="teal"
                size="sm"
                mt={2}
                onClick={() => handleGenerateDraft(selectedReview)}
                isLoading={generatingDraft}
                isDisabled={generatingDraft}
              >
                Suggest Draft
              </Button>
            </FormControl>
            
            <FormControl mb={4}>
              <FormLabel>Ratings (1-5)</FormLabel>
              <VStack align="stretch" spacing={4}>
                {Object.keys(reviewFormData.ratings).map(competency => (
                  <HStack key={competency} justify="space-between">
                    <Text>{competency}</Text>                    <HStack spacing={2}>                      {[1, 2, 3, 4, 5].map(value => (
                        <Button 
                          key={value} 
                          size="sm" 
                          variant={reviewFormData.ratings[competency] === value ? 'solid' : 'outline'}
                          colorScheme={reviewFormData.ratings[competency] === value ? 'blue' : 'gray'}
                          onClick={() => handleRatingChange(competency, value)}
                          aria-label={`Rate ${competency} as ${value}`}
                          aria-pressed={reviewFormData.ratings[competency] === value}
                        >
                          {value}
                        </Button>
                      ))}
                    </HStack>
                  </HStack>
                ))}
              </VStack>
            </FormControl>
          </ModalBody>            <ModalFooter>
            <Button variant="ghost" mr={3} onClick={submitReviewModal.onClose}>
              Cancel
            </Button><Button colorScheme="purple" onClick={handleSubmitReview}>
              Submit Review
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>      
      {/* Advance Cycle Confirmation Modal */}
      <Modal isOpen={showAdvanceConfirmation} onClose={() => setShowAdvanceConfirmation(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Advance Review Cycle</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Alert status="warning" mb={4}>
              <AlertIcon />
              <Box>
                <Text fontWeight="bold">Important!</Text>
                <Text>Advancing a review cycle cannot be undone.</Text>
              </Box>
            </Alert>
            <Text>
              Are you sure you want to advance the cycle "{cycles.find(c => c._id === selectedCycle)?.name}" from phase 
              <Badge mx={1}>{cycles.find(c => c._id === selectedCycle)?.status}</Badge> 
              to the next phase?
            </Text>
            <Box mt={4}>
              <Text fontWeight="bold">Phase progression:</Text>
              <Text fontSize="sm">planning → self → peer → manager → upward → calibration → completed</Text>
            </Box>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setShowAdvanceConfirmation(false)}>
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={confirmAdvanceCycle}
              isLoading={advancingCycle}
            >
              Advance Cycle
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Layout>
  );
};

export default Reviews;
