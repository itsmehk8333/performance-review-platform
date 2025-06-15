import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  CardBody,
  Badge,
  Button,
  Avatar,
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
  Textarea,
  useDisclosure,
  useToast,
  Link,
  SimpleGrid,
  Icon,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Checkbox,
  CheckboxGroup,
  Stack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { FiMessageSquare, FiTarget, FiRefreshCw, FiDownload, FiTag } from 'react-icons/fi';
import { format } from 'date-fns';
import { Link as RouterLink } from 'react-router-dom';
import Layout from '../components/Layout';
import { getFeedback, getGoals, createFeedback, getSuggestion, exportFeedback, getFeedbackTags } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Feedback = () => {
  const [feedback, setFeedback] = useState([]);
  const [goals, setGoals] = useState([]);
  const [selectedGoal, setSelectedGoal] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [availableTags, setAvailableTags] = useState({
    skills: [],
    values: [],
    initiatives: []
  });
  const [selectedTags, setSelectedTags] = useState({
    skills: [],
    values: [],
    initiatives: []
  });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user, isAdmin, isManager } = useAuth();
  const toast = useToast();
  
  useEffect(() => {
    fetchFeedback();
    fetchGoals();
    fetchTags();
  }, []);
  
  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const res = await getFeedback();
      setFeedback(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch feedback',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setLoading(false);
    }
  };
  
  const fetchGoals = async () => {
    try {
      const res = await getGoals();
      setGoals(res.data);
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  };
  
  const fetchTags = async () => {
    try {
      const res = await getFeedbackTags();
      setAvailableTags(res.data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };
  
  const handleSubmitFeedback = async () => {
    try {
      if (!selectedGoal) {
        toast({
          title: 'No goal selected',
          description: 'Please select a goal to provide feedback on',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      if (!feedbackText.trim()) {
        toast({
          title: 'Empty feedback',
          description: 'Please enter some feedback text',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
        await createFeedback({
        goalId: selectedGoal,
        text: feedbackText,
        tags: selectedTags
      });
      
      setFeedbackText('');
      setSelectedGoal('');
      setSelectedTags({
        skills: [],
        values: [],
        initiatives: []
      });
      onClose();
      await fetchFeedback();
      
      toast({
        title: 'Feedback submitted',
        description: 'Your feedback has been submitted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit feedback',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  const handleSuggestFeedback = async () => {
    try {
      if (!selectedGoal) {
        toast({
          title: 'No goal selected',
          description: 'Please select a goal first',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
        setLoadingSuggestion(true);
      const res = await getSuggestion({ goalId: selectedGoal });
      setFeedbackText(res.data.suggestion);
      setLoadingSuggestion(false);
      
      // If there was an API key issue, show a notification
      if (res.data.msg && res.data.msg.includes('API key')) {
        toast({
          title: 'API Key Not Configured',
          description: 'Using fallback suggestion. For AI-powered suggestions, please configure a valid OpenAI API key.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error getting suggestion:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate feedback suggestion',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setLoadingSuggestion(false);
    }
  };
  
  const handleExport = async (format) => {
    try {
      const res = await exportFeedback({ format });
      
      // Create blob and download
      const blob = new Blob([res.data], {
        type: format === 'pdf' ? 'application/pdf' : 'text/csv'
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `feedback-export.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      
      toast({
        title: 'Export successful',
        description: `Feedback exported as ${format.toUpperCase()}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error exporting feedback:', error);
      toast({
        title: 'Export failed',
        description: 'Unable to export feedback',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  const getSentimentColor = (sentiment) => {
    if (!sentiment) return 'gray';
    
    if (sentiment.label === 'positive') return 'green';
    if (sentiment.label === 'negative') return 'red';
    return 'gray';
  };
  
  // Helper function to get tag color based on tag type
  const getTagColor = (tagType) => {
    switch(tagType) {
      case 'skills': return 'blue';
      case 'values': return 'purple';
      case 'initiatives': return 'green';
      default: return 'gray';
    }
  };
  
  return (
    <Layout>
      <Box mb={8}>
        <Flex justify="space-between" align="center" mb={6}>
          <Heading>Feedback</Heading>
          <HStack>
            {(isAdmin() || isManager()) && (
              <Menu>
                <MenuButton as={Button} rightIcon={<ChevronDownIcon />} leftIcon={<FiDownload />}>
                  Export
                </MenuButton>
                <MenuList>
                  <MenuItem onClick={() => handleExport('csv')}>Export as CSV</MenuItem>
                  <MenuItem onClick={() => handleExport('pdf')}>Export as PDF</MenuItem>
                </MenuList>
              </Menu>
            )}
            <Button 
              colorScheme="blue" 
              leftIcon={<FiMessageSquare />} 
              onClick={onOpen}
            >
              Give Feedback
            </Button>
          </HStack>
        </Flex>
        
        {loading ? (
          <Flex justify="center" align="center" my={10}>
            <Spinner size="xl" color="blue.500" />
          </Flex>
        ) : feedback.length > 0 ? (
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>            {feedback.map(item => (
              <Card key={item._id}>
                <CardBody>
                  <HStack justify="space-between" mb={3}>
                    <HStack>
                      <Avatar size="sm" name={item.author?.name || 'Unknown User'} />
                      <Box>
                        <Text fontWeight="medium">{item.author?.name || 'Unknown User'}</Text>
                        <Text fontSize="xs" color="gray.500">
                          {format(new Date(item.createdAt), 'MMM d, yyyy h:mm a')}
                        </Text>
                      </Box>
                    </HStack>
                    {item.sentiment && (
                      <Badge colorScheme={getSentimentColor(item.sentiment)}>
                        {item.sentiment.label}
                      </Badge>
                    )}
                  </HStack>                    <Text mb={4}>{item.text}</Text>
                  
                  {/* Tags display */}
                  {item.tags && (
                    <Box mb={3}>
                      {item.tags.skills && item.tags.skills.length > 0 && (
                        <HStack spacing={2} mt={1} flexWrap="wrap">
                          {item.tags.skills.map(skill => (
                            <Badge key={skill} colorScheme="blue" variant="subtle">
                              {skill}
                            </Badge>
                          ))}
                        </HStack>
                      )}
                      
                      {item.tags.values && item.tags.values.length > 0 && (
                        <HStack spacing={2} mt={1} flexWrap="wrap">
                          {item.tags.values.map(value => (
                            <Badge key={value} colorScheme="purple" variant="subtle">
                              {value}
                            </Badge>
                          ))}
                        </HStack>
                      )}
                      
                      {item.tags.initiatives && item.tags.initiatives.length > 0 && (
                        <HStack spacing={2} mt={1} flexWrap="wrap">
                          {item.tags.initiatives.map(initiative => (
                            <Badge key={initiative} colorScheme="green" variant="subtle">
                              {initiative}
                            </Badge>
                          ))}
                        </HStack>
                      )}
                    </Box>
                  )}
                  
                  <HStack justify="space-between" fontSize="sm">
                    <Text color="gray.500">
                      Goal: {' '}
                      {item.goal ? (
                        <Link as={RouterLink} to={`/goals/${item.goal._id}`} color="blue.500">
                          {item.goal.title}
                        </Link>
                      ) : (
                        <Text as="span">General Feedback</Text>
                      )}
                    </Text>
                    {item.goal && (
                      <Badge colorScheme={
                        item.goal.level === 'company' ? 'purple' : 
                        item.goal.level === 'department' ? 'blue' : 
                        item.goal.level === 'team' ? 'green' : 'gray'
                      }>
                        {item.goal.level}
                      </Badge>
                    )}
                  </HStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        ) : (
          <Box textAlign="center" py={10}>
            <Icon as={FiMessageSquare} boxSize={10} color="gray.300" mb={3} />
            <Text fontSize="xl" mb={4}>No feedback yet</Text>
            <Text mb={6} color="gray.500">
              Start by giving feedback on goals across your organization
            </Text>
            <Button 
              colorScheme="blue" 
              leftIcon={<FiMessageSquare />} 
              onClick={onOpen}
            >
              Give Feedback
            </Button>
          </Box>
        )}
      </Box>
      
      {/* Give Feedback Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Give Feedback</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={4} isRequired>
              <FormLabel>Select Goal</FormLabel>
              <Select 
                placeholder="Choose a goal to give feedback on"
                value={selectedGoal}
                onChange={(e) => setSelectedGoal(e.target.value)}
              >
                {goals.map(goal => (
                  <option key={goal._id} value={goal._id}>
                    {goal.title} ({goal.level})
                  </option>
                ))}
              </Select>
            </FormControl>
              <FormControl mb={4} isRequired>
              <FormLabel>Your Feedback</FormLabel>
              <Textarea 
                value={feedbackText} 
                onChange={(e) => setFeedbackText(e.target.value)} 
                placeholder="Enter your feedback on this goal"
                rows={6}
              />
            </FormControl>
            
            <FormControl mb={4}>
              <FormLabel>Tags</FormLabel>
              <Tabs variant="soft-rounded" colorScheme="blue" size="sm">
                <TabList>
                  <Tab>Skills</Tab>
                  <Tab>Values</Tab>
                  <Tab>Initiatives</Tab>
                </TabList>
                <TabPanels>
                  <TabPanel>
                    <CheckboxGroup 
                      value={selectedTags.skills} 
                      onChange={(values) => setSelectedTags({...selectedTags, skills: values})}
                    >
                      <Stack spacing={2}>
                        {availableTags.skills.map((skill) => (
                          <Checkbox key={skill} value={skill}>{skill}</Checkbox>
                        ))}
                      </Stack>
                    </CheckboxGroup>
                  </TabPanel>
                  <TabPanel>
                    <CheckboxGroup 
                      value={selectedTags.values} 
                      onChange={(values) => setSelectedTags({...selectedTags, values: values})}
                    >
                      <Stack spacing={2}>
                        {availableTags.values.map((value) => (
                          <Checkbox key={value} value={value}>{value}</Checkbox>
                        ))}
                      </Stack>
                    </CheckboxGroup>
                  </TabPanel>
                  <TabPanel>
                    <CheckboxGroup 
                      value={selectedTags.initiatives} 
                      onChange={(values) => setSelectedTags({...selectedTags, initiatives: values})}
                    >
                      <Stack spacing={2}>
                        {availableTags.initiatives.map((initiative) => (
                          <Checkbox key={initiative} value={initiative}>{initiative}</Checkbox>
                        ))}
                      </Stack>
                    </CheckboxGroup>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </FormControl>
            
            <Button
              leftIcon={<FiRefreshCw />}
              onClick={handleSuggestFeedback}
              isLoading={loadingSuggestion}
              loadingText="Generating"
              mb={4}
              w="100%"
            >
              Suggest Draft with AI
            </Button>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleSubmitFeedback}>
              Submit Feedback
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Layout>
  );
};

export default Feedback;
