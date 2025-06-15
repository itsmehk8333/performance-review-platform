import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Button,
  HStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  useDisclosure,
  useToast,
  Badge,
  Card,
  CardBody,
  Progress,
  IconButton,
  Icon,
  Flex,
  Spinner
} from '@chakra-ui/react';
import { ChevronDownIcon, AddIcon } from '@chakra-ui/icons';
import { FiFilter } from 'react-icons/fi';
import { format } from 'date-fns';
import Layout from '../components/Layout';
import { getGoals, createGoal } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Link as RouterLink } from 'react-router-dom';

const GoalCard = ({ goal }) => {
  const badgeColorScheme = 
    goal.level === 'company' ? 'purple' : 
    goal.level === 'department' ? 'blue' : 
    goal.level === 'team' ? 'green' : 'gray';
  
  const statusColorScheme = goal.status === 'Completed' ? 'green' : 'yellow';
  
  return (
    <Card h="100%">
      <CardBody>
        <HStack justify="space-between" mb={2}>
          <Badge colorScheme={badgeColorScheme}>
            {goal.level}
          </Badge>
          <Badge colorScheme={statusColorScheme}>
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
          <Box fontSize="xs">
            <Text color="gray.500">
              Due: {format(new Date(goal.dueDate), 'MMM d, yyyy')}
            </Text>
            {goal.owner && goal.owner.name && (
              <Text color="gray.500">
                Owner: {goal.owner.name}
              </Text>
            )}
          </Box>
          <Button as={RouterLink} to={`/goals/${goal._id}`} size="xs" colorScheme="blue" variant="outline">
            View
          </Button>
        </HStack>
      </CardBody>
    </Card>
  );
};

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [filteredGoals, setFilteredGoals] = useState([]);
  const [levelFilter, setLevelFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [parentGoals, setParentGoals] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user, isAdmin, isManager } = useAuth();
  const toast = useToast();
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    level: 'individual',
    parentGoal: '',
    dueDate: ''
  });
  
  // Fetch goals on component mount
  useEffect(() => {
    fetchGoals();
  }, []);
  
  // Apply filters when goals or levelFilter changes
  useEffect(() => {
    filterGoals();
  }, [goals, levelFilter]);
  
  const fetchGoals = async () => {
    try {
      setLoading(true);
      const res = await getGoals();
      setGoals(res.data);
      
      // Get potential parent goals for creating new goals
      const potentialParents = res.data.filter(goal => 
        goal.level !== 'individual'
      );
      setParentGoals(potentialParents);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch goals',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setLoading(false);
    }
  };
  
  const filterGoals = () => {
    if (levelFilter === 'all') {
      setFilteredGoals(goals);
    } else {
      setFilteredGoals(goals.filter(goal => goal.level === levelFilter));
    }
  };
  
  const handleFilterChange = (level) => {
    setLevelFilter(level);
  };
  
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // If level is company, clear parent goal
    if (name === 'level' && value === 'company') {
      setFormData(prev => ({ ...prev, parentGoal: '' }));
    }
  };
  
  const handleSubmit = async () => {
    try {
      // Validate form
      if (!formData.title || !formData.dueDate) {
        toast({
          title: 'Missing fields',
          description: 'Please fill out all required fields',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      // Create goal
      await createGoal(formData);
      
      // Reset form and close modal
      setFormData({
        title: '',
        description: '',
        level: 'individual',
        parentGoal: '',
        dueDate: ''
      });
      onClose();
      
      // Refresh goals
      fetchGoals();
      
      toast({
        title: 'Goal created',
        description: 'Your goal has been created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error creating goal:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.msg || 'Failed to create goal',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Check if user can create a goal at a certain level
  const canCreateGoalAtLevel = (level) => {
    if (level === 'company') return isAdmin();
    if (level === 'department' || level === 'team') return isManager();
    return true; // Anyone can create individual goals
  };
  
  return (
    <Layout>
      <Box mb={8}>
        <Flex justify="space-between" align="center" mb={6}>
          <Heading>Goals</Heading>
          <Button 
            leftIcon={<AddIcon />} 
            colorScheme="blue" 
            onClick={onOpen}
          >
            New Goal
          </Button>
        </Flex>
        
        <HStack mb={6} spacing={4}>
          <Menu>
            <MenuButton as={Button} rightIcon={<ChevronDownIcon />} size="sm" leftIcon={<Icon as={FiFilter} />}>
              Level: {levelFilter === 'all' ? 'All' : levelFilter}
            </MenuButton>
            <MenuList>
              <MenuItem onClick={() => handleFilterChange('all')}>All</MenuItem>
              <MenuItem onClick={() => handleFilterChange('company')}>Company</MenuItem>
              <MenuItem onClick={() => handleFilterChange('department')}>Department</MenuItem>
              <MenuItem onClick={() => handleFilterChange('team')}>Team</MenuItem>
              <MenuItem onClick={() => handleFilterChange('individual')}>Individual</MenuItem>
            </MenuList>
          </Menu>
        </HStack>
        
        {loading ? (
          <Flex justify="center" align="center" my={10}>
            <Spinner size="xl" color="blue.500" />
          </Flex>
        ) : filteredGoals.length > 0 ? (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {filteredGoals.map(goal => (
              <GoalCard key={goal._id} goal={goal} />
            ))}
          </SimpleGrid>
        ) : (
          <Box textAlign="center" py={10}>
            <Text fontSize="xl" mb={4}>No goals found</Text>
            <Text mb={6} color="gray.500">
              {levelFilter === 'all' 
                ? "You don't have any goals yet" 
                : `You don't have any ${levelFilter} goals yet`}
            </Text>
            <Button 
              colorScheme="blue" 
              onClick={onOpen}
            >
              Create your first goal
            </Button>
          </Box>
        )}
      </Box>
      
      {/* New Goal Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Goal</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={4} isRequired>
              <FormLabel>Title</FormLabel>
              <Input 
                name="title" 
                value={formData.title} 
                onChange={handleFormChange} 
                placeholder="Goal title"
              />
            </FormControl>
            
            <FormControl mb={4}>
              <FormLabel>Description</FormLabel>
              <Textarea 
                name="description" 
                value={formData.description} 
                onChange={handleFormChange} 
                placeholder="Describe this goal"
                rows={4}
              />
            </FormControl>
            
            <FormControl mb={4} isRequired>
              <FormLabel>Level</FormLabel>
              <Select 
                name="level" 
                value={formData.level} 
                onChange={handleFormChange}
              >
                {canCreateGoalAtLevel('company') && <option value="company">Company</option>}
                {canCreateGoalAtLevel('department') && <option value="department">Department</option>}
                {canCreateGoalAtLevel('team') && <option value="team">Team</option>}
                <option value="individual">Individual</option>
              </Select>
            </FormControl>
            
            {formData.level !== 'company' && (
              <FormControl mb={4}>
                <FormLabel>Parent Goal</FormLabel>
                <Select 
                  name="parentGoal" 
                  value={formData.parentGoal} 
                  onChange={handleFormChange}
                  placeholder="Select a parent goal (optional)"
                >
                  {parentGoals
                    .filter(goal => {
                      if (formData.level === 'department') return goal.level === 'company';
                      if (formData.level === 'team') return ['company', 'department'].includes(goal.level);
                      if (formData.level === 'individual') return ['company', 'department', 'team'].includes(goal.level);
                      return false;
                    })
                    .map(goal => (
                      <option key={goal._id} value={goal._id}>
                        {goal.title} ({goal.level})
                      </option>
                    ))
                  }
                </Select>
              </FormControl>
            )}
            
            <FormControl mb={4} isRequired>
              <FormLabel>Due Date</FormLabel>
              <Input 
                name="dueDate" 
                type="date" 
                value={formData.dueDate} 
                onChange={handleFormChange}
              />
            </FormControl>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleSubmit}>
              Create Goal
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Layout>
  );
};

export default Goals;
