import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  IconButton,
  Divider,
  useToast,
  Card,
  CardHeader,
  CardBody,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Switch,
  Stack,
  Badge,
  Progress,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  RadioGroup,
  Radio,
  Checkbox,
  CheckboxGroup,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper
} from '@chakra-ui/react';
import { FiPlus, FiCalendar, FiUsers, FiChevronRight, FiEdit, FiTrash2, FiCheckCircle, FiBarChart2, FiRefreshCw, FiPlay, FiSkipForward, FiClock, FiSave } from 'react-icons/fi';
import { format } from 'date-fns';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import {
  getReviewCycles,
  getReviewCycle,
  createReviewCycle,
  updateReviewCycle,  deleteReviewCycle,
  advanceReviewCycle,
  getReviewTemplates,
  getUsers,
  assignReviews,
  startCycle,
  advancePhase,
  configurePhases,
  assignAutoReviews,
  processWorkflows
} from '../utils/api';

const ReviewCycles = () => {  const [cycles, setCycles] = useState([]);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [phases, setPhases] = useState([
    { name: 'Self Review', duration: 7, allowedReviewers: ['self'] },
    { name: 'Peer Review', duration: 14, allowedReviewers: ['peer'] },
    { name: 'Manager Review', duration: 7, allowedReviewers: ['manager'] },
    { name: 'Calibration', duration: 7, allowedReviewers: ['manager', 'admin'] }
  ]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    cycleType: 'custom',
    reviewTypes: {
      self: true,
      peer: true,
      manager: true,
      upward: false
    },
    anonymitySettings: {
      peerReviews: 'full',
      upwardReviews: 'full'
    },
    participants: [],
    templateId: '',
    recurrence: {
      isRecurring: false,
      frequency: 'annual'
    }
  });
  
  const [assignData, setAssignData] = useState({
    cycleId: '',
    selectedUsers: [],
    peerCount: 2,
    upwardCount: 3
  });
  
  const createCycleDisclosure = useDisclosure();
  const assignReviewsDisclosure = useDisclosure();
  const cycleDetailDisclosure = useDisclosure();
  
  const { user } = useAuth();
  const toast = useToast();
  
  const isAdmin = user?.role === 'Admin';
  
  useEffect(() => {
    fetchCycles();
    fetchTemplates();
    fetchUsers();
  }, []);
  
  const fetchCycles = async () => {
    try {
      setLoading(true);
      const res = await getReviewCycles();
      setCycles(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching cycles:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch review cycles',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
      setLoading(false);
    }
  };
  
  const fetchTemplates = async () => {
    try {
      const res = await getReviewTemplates();
      setTemplates(res.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };
  
  const fetchUsers = async () => {
    try {
      const res = await getUsers();
      setUsers(res.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };
  
  const fetchCycleDetails = async (id) => {
    try {
      const res = await getReviewCycle(id);
      setSelectedCycle(res.data);
      cycleDetailDisclosure.onOpen();
    } catch (error) {
      console.error('Error fetching cycle details:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch cycle details',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };
  
  const handleCreateCycle = async () => {
    try {
      if (!formData.name) {
        toast({
          title: 'Error',
          description: 'Cycle name is required',
          status: 'error',
          duration: 3000,
          isClosable: true
        });
        return;
      }
      
      if (!formData.startDate || !formData.endDate) {
        toast({
          title: 'Error',
          description: 'Start and end dates are required',
          status: 'error',
          duration: 3000,
          isClosable: true
        });
        return;
      }
      
      if (!formData.templateId) {
        toast({
          title: 'Error',
          description: 'Please select a review template',
          status: 'error',
          duration: 3000,
          isClosable: true
        });
        return;
      }
      
      await createReviewCycle(formData);
      
      toast({
        title: 'Success',
        description: 'Review cycle created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      
      // Reset form and close modal
      setFormData({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        cycleType: 'custom',
        reviewTypes: {
          self: true,
          peer: true,
          manager: true,
          upward: false
        },
        anonymitySettings: {
          peerReviews: 'full',
          upwardReviews: 'full'
        },
        participants: [],
        templateId: '',
        recurrence: {
          isRecurring: false,
          frequency: 'annual'
        }
      });
      
      createCycleDisclosure.onClose();
      
      // Refresh cycles
      fetchCycles();
    } catch (error) {
      console.error('Error creating cycle:', error);
      toast({
        title: 'Error',
        description: 'Failed to create review cycle',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };
  
  const handleAssignReviews = async () => {
    try {
      if (!assignData.cycleId) {
        toast({
          title: 'Error',
          description: 'Please select a review cycle',
          status: 'error',
          duration: 3000,
          isClosable: true
        });
        return;
      }
      
      await assignReviews(assignData);
      
      toast({
        title: 'Success',
        description: 'Reviews assigned successfully',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      
      // Reset form and close modal
      setAssignData({
        cycleId: '',
        selectedUsers: [],
        peerCount: 2,
        upwardCount: 3
      });
      
      assignReviewsDisclosure.onClose();
      
      // Refresh cycles
      fetchCycles();
    } catch (error) {
      console.error('Error assigning reviews:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.msg || 'Failed to assign reviews',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };
  
  const handleAdvanceCycle = async (id) => {
    try {
      await advanceReviewCycle(id);
      
      toast({
        title: 'Success',
        description: 'Review cycle advanced to next phase',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      
      // Refresh cycles
      fetchCycles();
      
      // Update selected cycle if it's open
      if (selectedCycle && selectedCycle._id === id) {
        fetchCycleDetails(id);
      }
    } catch (error) {
      console.error('Error advancing cycle:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.msg || 'Failed to advance cycle',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };
  
  // Phase configuration handlers
  const handleStartCycle = async (cycleId) => {
    try {
      await startCycle(cycleId);
      
      toast({
        title: 'Cycle started',
        description: 'The review cycle has been started successfully',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      
      fetchCycles(); // Refresh cycles data
    } catch (err) {
      toast({
        title: 'Failed to start cycle',
        description: err.response?.data?.msg || 'Something went wrong',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };
  
  const handleAdvancePhase = async (cycleId) => {
    try {
      await advancePhase(cycleId);
      
      toast({
        title: 'Phase advanced',
        description: 'The review cycle phase has been advanced successfully',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      
      fetchCycles(); // Refresh cycles data
    } catch (err) {
      toast({
        title: 'Failed to advance phase',
        description: err.response?.data?.msg || 'Something went wrong',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };
  
  const handleConfigurePhases = async (cycleId) => {
    try {
      await configurePhases(cycleId, phases);
      
      toast({
        title: 'Phases configured',
        description: 'The review cycle phases have been configured successfully',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      
      fetchCycles(); // Refresh cycles data
    } catch (err) {
      toast({
        title: 'Failed to configure phases',
        description: err.response?.data?.msg || 'Something went wrong',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };
  
  const handleAutoAssignReviews = async (cycleId) => {
    try {
      const cycle = cycles.find(c => c._id === cycleId);
      if (!cycle || !cycle.currentPhase) {
        toast({
          title: 'Cannot auto-assign reviews',
          description: 'The cycle must be active with a current phase',
          status: 'warning',
          duration: 3000,
          isClosable: true
        });
        return;
      }
      
      await assignAutoReviews(cycleId, cycle.currentPhase);
      
      toast({
        title: 'Reviews auto-assigned',
        description: 'The reviews have been automatically assigned based on org chart',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (err) {
      toast({
        title: 'Failed to auto-assign reviews',
        description: err.response?.data?.msg || 'Something went wrong',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };
  
  const handleProcessWorkflows = async () => {
    try {
      await processWorkflows();
      
      toast({
        title: 'Workflows processed',
        description: 'Review workflows have been processed (deadlines checked, reminders sent)',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (err) {
      toast({
        title: 'Failed to process workflows',
        description: err.response?.data?.msg || 'Something went wrong',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };
  
  const renderPhaseIndicator = (status) => {
    const phases = ['planning', 'self', 'peer', 'manager', 'upward', 'calibration', 'completed'];
    const currentIndex = phases.indexOf(status);
    
    let progressValue = 0;
    if (currentIndex >= 0) {
      progressValue = (currentIndex / (phases.length - 1)) * 100;
    }
    
    return (
      <Box mb={3}>
        <Text fontSize="sm" mb={1}>Phase: {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Planning'}</Text>
        <Progress value={progressValue} size="sm" colorScheme="blue" borderRadius="full" />
        <HStack justify="space-between" mt={1} fontSize="xs" color="gray.500">
          <Text>Planning</Text>
          <Text>Self</Text>
          <Text>Peer</Text>
          <Text>Manager</Text>
          <Text>Upward</Text>
          <Text>Calibration</Text>
          <Text>Completed</Text>
        </HStack>
      </Box>
    );
  };
  
  return (
    <Layout>
      <Box mb={8}>
        <HStack justify="space-between" mb={6} wrap="wrap">
          <Heading size="lg">Review Cycles</Heading>
          <HStack>
            {isAdmin && (
              <>
                <Button 
                  leftIcon={<FiUsers />} 
                  colorScheme="teal" 
                  onClick={assignReviewsDisclosure.onOpen}
                >
                  Assign Reviews
                </Button>
                <Button 
                  leftIcon={<FiPlus />} 
                  colorScheme="blue" 
                  onClick={createCycleDisclosure.onOpen}
                >
                  Create Cycle
                </Button>
              </>
            )}
          </HStack>
        </HStack>
        
        {loading ? (
          <Text>Loading cycles...</Text>
        ) : cycles.length > 0 ? (
          <VStack spacing={4} align="stretch">
            {cycles.map(cycle => (
              <Card key={cycle._id} variant="outline">
                <CardBody>
                  <HStack justify="space-between" wrap="wrap">
                    <VStack align="start" spacing={1}>
                      <Heading size="md">{cycle.name}</Heading>
                      <HStack>
                        <Badge colorScheme={cycle.status === 'completed' ? 'green' : 'blue'}>
                          {cycle.status || 'Planning'}
                        </Badge>
                        <Badge colorScheme="purple">
                          {cycle.cycleType || 'Custom'}
                        </Badge>
                      </HStack>
                      <Text fontSize="sm" color="gray.600">
                        {cycle.startDate && cycle.endDate ? 
                          `${format(new Date(cycle.startDate), 'MMM d, yyyy')} - ${format(new Date(cycle.endDate), 'MMM d, yyyy')}` 
                          : 'Dates not set'}
                      </Text>
                    </VStack>
                    
                    <HStack>
                      {isAdmin && cycle.status !== 'completed' && (
                        <Button 
                          leftIcon={<FiRefreshCw />} 
                          size="sm"
                          onClick={() => handleAdvanceCycle(cycle._id)}
                        >
                          Advance Phase
                        </Button>
                      )}
                      <Button 
                        rightIcon={<FiChevronRight />} 
                        size="sm"
                        onClick={() => fetchCycleDetails(cycle._id)}
                      >
                        Details
                      </Button>
                    </HStack>
                  </HStack>
                  
                  {renderPhaseIndicator(cycle.status)}
                  
                  <HStack mt={2} fontSize="sm" color="gray.600">
                    <Text>
                      {cycle.templateId?.name ? `Template: ${cycle.templateId.name}` : 'No template assigned'}
                    </Text>
                  </HStack>
                </CardBody>
              </Card>
            ))}
          </VStack>
        ) : (
          <Box textAlign="center" py={10}>
            <Text mb={4}>No review cycles yet</Text>
            {isAdmin && (
              <Button
                leftIcon={<FiPlus />}
                colorScheme="blue"
                onClick={createCycleDisclosure.onOpen}
              >
                Create your first review cycle
              </Button>
            )}
          </Box>
        )}
      </Box>
      
      {/* Create Cycle Modal */}
      <Modal isOpen={createCycleDisclosure.isOpen} onClose={createCycleDisclosure.onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create Review Cycle</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={4}>
              <FormLabel>Cycle Name</FormLabel>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Q2 2025 Review, Mid-Year 2025, Annual Review 2025"
              />
            </FormControl>
            
            <FormControl mb={4}>
              <FormLabel>Description</FormLabel>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter cycle description"
              />
            </FormControl>
            
            <HStack mb={4} spacing={4}>
              <FormControl>
                <FormLabel>Start Date</FormLabel>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>End Date</FormLabel>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </FormControl>
            </HStack>
            
            <FormControl mb={4}>
              <FormLabel>Cycle Type</FormLabel>
              <Select
                value={formData.cycleType}
                onChange={(e) => setFormData({ ...formData, cycleType: e.target.value })}
              >
                <option value="quarterly">Quarterly</option>
                <option value="half-yearly">Half-Yearly</option>
                <option value="annual">Annual</option>
                <option value="custom">Custom</option>
              </Select>
            </FormControl>
            
            <FormControl mb={4}>
              <FormLabel>Review Template</FormLabel>
              <Select
                value={formData.templateId}
                onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
                placeholder="Select a template"
              >
                {templates.map(template => (
                  <option key={template._id} value={template._id}>
                    {template.name}
                  </option>
                ))}
              </Select>
            </FormControl>
            
            <FormControl mb={4}>
              <FormLabel>Review Types</FormLabel>
              <VStack align="start">
                <Checkbox
                  isChecked={formData.reviewTypes.self}
                  onChange={(e) => setFormData({
                    ...formData,
                    reviewTypes: {
                      ...formData.reviewTypes,
                      self: e.target.checked
                    }
                  })}
                >
                  Self Assessment
                </Checkbox>
                
                <Checkbox
                  isChecked={formData.reviewTypes.peer}
                  onChange={(e) => setFormData({
                    ...formData,
                    reviewTypes: {
                      ...formData.reviewTypes,
                      peer: e.target.checked
                    }
                  })}
                >
                  Peer Review
                </Checkbox>
                
                <Checkbox
                  isChecked={formData.reviewTypes.manager}
                  onChange={(e) => setFormData({
                    ...formData,
                    reviewTypes: {
                      ...formData.reviewTypes,
                      manager: e.target.checked
                    }
                  })}
                >
                  Manager Review
                </Checkbox>
                
                <Checkbox
                  isChecked={formData.reviewTypes.upward}
                  onChange={(e) => setFormData({
                    ...formData,
                    reviewTypes: {
                      ...formData.reviewTypes,
                      upward: e.target.checked
                    }
                  })}
                >
                  Upward Review
                </Checkbox>
              </VStack>
            </FormControl>
            
            {formData.reviewTypes.peer && (
              <FormControl mb={4}>
                <FormLabel>Peer Review Anonymity</FormLabel>
                <RadioGroup
                  value={formData.anonymitySettings.peerReviews}
                  onChange={(value) => setFormData({
                    ...formData,
                    anonymitySettings: {
                      ...formData.anonymitySettings,
                      peerReviews: value
                    }
                  })}
                >
                  <Stack direction="column">
                    <Radio value="full">Full (reviewer name never shown)</Radio>
                    <Radio value="partial">Partial (reviewer name shown after cycle completion)</Radio>
                    <Radio value="none">None (reviewer name always visible)</Radio>
                  </Stack>
                </RadioGroup>
              </FormControl>
            )}
            
            {formData.reviewTypes.upward && (
              <FormControl mb={4}>
                <FormLabel>Upward Review Anonymity</FormLabel>
                <RadioGroup
                  value={formData.anonymitySettings.upwardReviews}
                  onChange={(value) => setFormData({
                    ...formData,
                    anonymitySettings: {
                      ...formData.anonymitySettings,
                      upwardReviews: value
                    }
                  })}
                >
                  <Stack direction="column">
                    <Radio value="full">Full (reviewer name never shown)</Radio>
                    <Radio value="partial">Partial (reviewer name shown after cycle completion)</Radio>
                    <Radio value="none">None (reviewer name always visible)</Radio>
                  </Stack>
                </RadioGroup>
              </FormControl>
            )}
            
            <FormControl mb={4}>
              <FormLabel mb={0}>Recurring Cycle</FormLabel>
              <HStack>
                <Switch
                  isChecked={formData.recurrence.isRecurring}
                  onChange={(e) => setFormData({
                    ...formData,
                    recurrence: {
                      ...formData.recurrence,
                      isRecurring: e.target.checked
                    }
                  })}
                  mr={2}
                />
                <Text fontSize="sm">Set up this cycle to recur automatically</Text>
              </HStack>
            </FormControl>
            
            {formData.recurrence.isRecurring && (
              <FormControl mb={4}>
                <FormLabel>Recurrence Frequency</FormLabel>
                <Select
                  value={formData.recurrence.frequency}
                  onChange={(e) => setFormData({
                    ...formData,
                    recurrence: {
                      ...formData.recurrence,
                      frequency: e.target.value
                    }
                  })}
                >
                  <option value="quarterly">Quarterly</option>
                  <option value="half-yearly">Half-Yearly</option>
                  <option value="annual">Annual</option>
                </Select>
              </FormControl>
            )}
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={createCycleDisclosure.onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleCreateCycle}>
              Create Cycle
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Assign Reviews Modal */}
      <Modal isOpen={assignReviewsDisclosure.isOpen} onClose={assignReviewsDisclosure.onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Assign Reviews</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Alert status="info" mb={4}>
              <AlertIcon />
              <Box>
                <AlertTitle>Review Assignment</AlertTitle>
                <AlertDescription>
                  This will create review assignments for the selected cycle. Reviews will be created based on the cycle's configured review types.
                </AlertDescription>
              </Box>
            </Alert>
            
            <FormControl mb={4}>
              <FormLabel>Select Review Cycle</FormLabel>
              <Select
                value={assignData.cycleId}
                onChange={(e) => setAssignData({ ...assignData, cycleId: e.target.value })}
                placeholder="Select a cycle"
              >
                {cycles
                  .filter(cycle => cycle.status === 'planning')
                  .map(cycle => (
                    <option key={cycle._id} value={cycle._id}>
                      {cycle.name}
                    </option>
                  ))}
              </Select>
              {cycles.filter(cycle => cycle.status === 'planning').length === 0 && (
                <Text fontSize="sm" color="red.500" mt={1}>
                  No cycles in planning phase available. Create a new cycle first.
                </Text>
              )}
            </FormControl>
            
            <FormControl mb={4}>
              <FormLabel>Include Specific Users (Optional)</FormLabel>
              <Text fontSize="sm" color="gray.600" mb={2}>
                Leave empty to include all users
              </Text>
              <Select
                isMulti
                value={assignData.selectedUsers}
                onChange={(selectedOptions) => setAssignData({ 
                  ...assignData, 
                  selectedUsers: selectedOptions 
                })}
                placeholder="Select users"
              >
                {users.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.role?.name || 'No Role'})
                  </option>
                ))}
              </Select>
            </FormControl>
            
            <HStack mb={4} spacing={4}>
              <FormControl>
                <FormLabel>Peer Reviews Per Person</FormLabel>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={assignData.peerCount}
                  onChange={(e) => setAssignData({ 
                    ...assignData, 
                    peerCount: parseInt(e.target.value) 
                  })}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Upward Reviews Per Manager</FormLabel>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={assignData.upwardCount}
                  onChange={(e) => setAssignData({ 
                    ...assignData, 
                    upwardCount: parseInt(e.target.value) 
                  })}
                />
              </FormControl>
            </HStack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={assignReviewsDisclosure.onClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleAssignReviews}
              isDisabled={!assignData.cycleId}
            >
              Assign Reviews
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Cycle Details Modal */}
      {selectedCycle && (
        <Modal 
          isOpen={cycleDetailDisclosure.isOpen} 
          onClose={cycleDetailDisclosure.onClose} 
          size="2xl"
        >
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>{selectedCycle.name}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <HStack mb={4} spacing={4} wrap="wrap">
                <Badge colorScheme={selectedCycle.status === 'completed' ? 'green' : 'blue'} fontSize="md" px={2} py={1}>
                  {selectedCycle.status ? selectedCycle.status.charAt(0).toUpperCase() + selectedCycle.status.slice(1) : 'Planning'}
                </Badge>
                <Badge colorScheme="purple" fontSize="md" px={2} py={1}>
                  {selectedCycle.cycleType ? selectedCycle.cycleType.charAt(0).toUpperCase() + selectedCycle.cycleType.slice(1) : 'Custom'}
                </Badge>
                {selectedCycle.recurrence?.isRecurring && (
                  <Badge colorScheme="green" fontSize="md" px={2} py={1}>
                    Recurring
                  </Badge>
                )}
              </HStack>
              
              {renderPhaseIndicator(selectedCycle.status)}
              
              <Box mb={4}>
                <Text color="gray.600">{selectedCycle.description}</Text>
              </Box>
              
              <HStack mb={4} spacing={8}>
                <Stat>
                  <StatLabel>Start Date</StatLabel>
                  <StatNumber fontSize="md">
                    {selectedCycle.startDate 
                      ? format(new Date(selectedCycle.startDate), 'MMM d, yyyy') 
                      : 'Not set'}
                  </StatNumber>
                </Stat>
                
                <Stat>
                  <StatLabel>End Date</StatLabel>
                  <StatNumber fontSize="md">
                    {selectedCycle.endDate 
                      ? format(new Date(selectedCycle.endDate), 'MMM d, yyyy') 
                      : 'Not set'}
                  </StatNumber>
                </Stat>
              </HStack>
              
              <Divider my={4} />
              
              <Heading size="md" mb={4}>Review Configuration</Heading>
              
              <HStack mb={4} spacing={8} wrap="wrap">
                <Box>
                  <Text fontWeight="medium">Template</Text>
                  <Text>
                    {selectedCycle.templateId?.name || 'None'}
                  </Text>
                </Box>
                
                <Box>
                  <Text fontWeight="medium">Review Types</Text>
                  <HStack mt={1} spacing={2}>
                    {selectedCycle.reviewTypes?.self && (
                      <Badge colorScheme="blue">Self</Badge>
                    )}
                    {selectedCycle.reviewTypes?.peer && (
                      <Badge colorScheme="green">Peer</Badge>
                    )}
                    {selectedCycle.reviewTypes?.manager && (
                      <Badge colorScheme="purple">Manager</Badge>
                    )}
                    {selectedCycle.reviewTypes?.upward && (
                      <Badge colorScheme="orange">Upward</Badge>
                    )}
                  </HStack>
                </Box>
              </HStack>
              
              <Box mb={4}>
                <Text fontWeight="medium">Anonymity Settings</Text>
                <HStack mt={1} spacing={4}>
                  {selectedCycle.reviewTypes?.peer && (
                    <Box>
                      <Text fontSize="sm">Peer Reviews:</Text>
                      <Badge colorScheme={
                        selectedCycle.anonymitySettings?.peerReviews === 'full' ? 'green' :
                        selectedCycle.anonymitySettings?.peerReviews === 'partial' ? 'yellow' : 'red'
                      }>
                        {selectedCycle.anonymitySettings?.peerReviews || 'None'}
                      </Badge>
                    </Box>
                  )}
                  
                  {selectedCycle.reviewTypes?.upward && (
                    <Box>
                      <Text fontSize="sm">Upward Reviews:</Text>
                      <Badge colorScheme={
                        selectedCycle.anonymitySettings?.upwardReviews === 'full' ? 'green' :
                        selectedCycle.anonymitySettings?.upwardReviews === 'partial' ? 'yellow' : 'red'
                      }>
                        {selectedCycle.anonymitySettings?.upwardReviews || 'None'}
                      </Badge>
                    </Box>
                  )}
                </HStack>
              </Box>
              
              {isAdmin && selectedCycle.status !== 'completed' && (
                <Button 
                  leftIcon={<FiRefreshCw />} 
                  colorScheme="blue"
                  mt={4}
                  onClick={() => handleAdvanceCycle(selectedCycle._id)}
                >
                  Advance to Next Phase
                </Button>
              )}
              
              {/* Workflow & Phases Card */}
              {isAdmin && selectedCycle && (
                <Card mb={6}>
                  <CardHeader>
                    <HStack justifyContent="space-between" alignItems="center">
                      <Heading size="md">
                        <HStack spacing={2}>
                          <FiClock />
                          <Text>Workflow & Phases</Text>
                        </HStack>
                      </Heading>
                      {/* Phase control buttons */}
                      <HStack spacing={3}>
                        {!selectedCycle.currentPhase ? (
                          <Button
                            size="sm"
                            colorScheme="green"
                            leftIcon={<FiPlay />}
                            onClick={() => handleStartCycle(selectedCycle._id)}
                          >
                            Start Cycle
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            colorScheme="blue"
                            leftIcon={<FiSkipForward />}
                            onClick={() => handleAdvancePhase(selectedCycle._id)}
                          >
                            Advance Phase
                          </Button>
                        )}
                        <Button
                          size="sm"
                          colorScheme="purple"
                          leftIcon={<FiRefreshCw />}
                          onClick={handleProcessWorkflows}
                        >
                          Process Workflows
                        </Button>
                        <Button
                          size="sm"
                          colorScheme="teal"
                          leftIcon={<FiUsers />}
                          onClick={() => handleAutoAssignReviews(selectedCycle._id)}
                        >
                          Auto-Assign Reviews
                        </Button>
                      </HStack>
                    </HStack>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={6} align="stretch">
                      {/* Current phase info */}
                      {selectedCycle.currentPhase ? (
                        <Alert status="info">
                          <AlertIcon />
                          <Box>
                            <AlertTitle>Current Phase: {selectedCycle.currentPhase}</AlertTitle>
                            <AlertDescription>
                              {selectedCycle.phaseDeadlines && selectedCycle.phaseDeadlines[selectedCycle.currentPhase] ? (
                                <Text>
                                  Deadline: {format(new Date(selectedCycle.phaseDeadlines[selectedCycle.currentPhase]), 'MMMM d, yyyy')}
                                </Text>
                              ) : (
                                <Text>No deadline set for this phase</Text>
                              )}
                            </AlertDescription>
                          </Box>
                        </Alert>
                      ) : (
                        <Alert status="warning">
                          <AlertIcon />
                          <Box>
                            <AlertTitle>Cycle Not Started</AlertTitle>
                            <AlertDescription>
                              Configure phases below and click "Start Cycle" to begin the first phase
                            </AlertDescription>
                          </Box>
                        </Alert>
                      )}
                      
                      {/* Phase configuration */}
                      <Box>
                        <Heading size="sm" mb={4}>Phase Configuration</Heading>
                        <Table size="sm" variant="simple">
                          <Thead>
                            <Tr>
                              <Th>Phase Name</Th>
                              <Th>Duration (days)</Th>
                              <Th>Allowed Reviewers</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {phases.map((phase, index) => (
                              <Tr key={index}>
                                <Td>
                                  <Input 
                                    size="sm" 
                                    value={phase.name} 
                                    onChange={(e) => {
                                      const newPhases = [...phases];
                                      newPhases[index].name = e.target.value;
                                      setPhases(newPhases);
                                    }}
                                  />
                                </Td>
                                <Td>
                                  <NumberInput 
                                    size="sm" 
                                    value={phase.duration} 
                                    min={1} 
                                    max={60}
                                    onChange={(valueString) => {
                                      const newPhases = [...phases];
                                      newPhases[index].duration = parseInt(valueString);
                                      setPhases(newPhases);
                                    }}
                                  >
                                    <NumberInputField />
                                    <NumberInputStepper>
                                      <NumberIncrementStepper />
                                      <NumberDecrementStepper />
                                    </NumberInputStepper>
                                  </NumberInput>
                                </Td>
                                <Td>
                                  <CheckboxGroup
                                    value={phase.allowedReviewers}
                                    onChange={(values) => {
                                      const newPhases = [...phases];
                                      newPhases[index].allowedReviewers = values;
                                      setPhases(newPhases);
                                    }}
                                  >
                                    <Stack direction="row">
                                      <Checkbox value="self">Self</Checkbox>
                                      <Checkbox value="peer">Peer</Checkbox>
                                      <Checkbox value="manager">Manager</Checkbox>
                                      <Checkbox value="admin">Admin</Checkbox>
                                    </Stack>
                                  </CheckboxGroup>
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                        
                        <Flex justify="flex-end" mt={4}>
                          <Button
                            colorScheme="blue"
                            size="sm"
                            leftIcon={<FiSave />}
                            onClick={() => handleConfigurePhases(selectedCycle._id)}
                          >
                            Save Phase Configuration
                          </Button>
                        </Flex>
                      </Box>
                    </VStack>
                  </CardBody>
                </Card>
              )}
            </ModalBody>
            
            <ModalFooter>
              <Button onClick={cycleDetailDisclosure.onClose}>
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Layout>
  );
};

export default ReviewCycles;
