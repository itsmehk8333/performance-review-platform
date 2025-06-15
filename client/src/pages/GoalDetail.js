import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  Card,
  CardBody,
  Badge,
  Button,
  HStack,
  VStack,
  Progress,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark,
  FormControl,
  FormLabel,
  Textarea,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Spinner,
  Flex,
  Divider,
  useToast,
  IconButton,
  Icon,
  Tooltip,
  Avatar,
  Checkbox,
  CheckboxGroup,
  Stack,
  Input
} from '@chakra-ui/react';
import { FiEdit, FiArrowLeft, FiAlertTriangle, FiMessageSquare, FiRefreshCw, FiTag, FiMessageCircle, FiClock } from 'react-icons/fi';
import Layout from '../components/Layout';
import { getGoalById, updateGoalProgress, createFeedback, getFeedback, getSuggestion, getFeedbackTags, addGoalTags, addGoalComment } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const GoalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [feedback, setFeedback] = useState([]);  const [feedbackText, setFeedbackText] = useState('');
  const [loadingFeedback, setLoadingFeedback] = useState(false);
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
  const [newTag, setNewTag] = useState('');
  const [commentText, setCommentText] = useState('');
  const [progressNote, setProgressNote] = useState('');
  const [loadingComment, setLoadingComment] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const commentModalDisclosure = useDisclosure();
  const tagModalDisclosure = useDisclosure();
  const { user } = useAuth();
  const toast = useToast();
  
  useEffect(() => {
    fetchGoal();
    fetchFeedback();
    fetchTags();
  }, [id]);
  
  const fetchGoal = async () => {
    try {
      setLoading(true);
      const res = await getGoalById(id);
      setGoal(res.data);
      setProgress(res.data.progress);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching goal:', error);
      setError('Failed to fetch goal details');
      setLoading(false);
    }
  };
  
  const fetchFeedback = async () => {
    try {
      setLoadingFeedback(true);
      const res = await getFeedback({ goalId: id });
      setFeedback(res.data);
      setLoadingFeedback(false);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      setLoadingFeedback(false);
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
    const handleProgressUpdate = async () => {
    try {
      await updateGoalProgress(id, { 
        progress, 
        note: progressNote || `Progress updated to ${progress}%` 
      });
      setProgressNote('');
      await fetchGoal(); // Refresh goal data
      toast({
        title: 'Progress updated',
        description: `Goal progress updated to ${progress}%`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error updating progress:', error);
      toast({
        title: 'Error',
        description: 'Failed to update progress',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  const handleSubmitFeedback = async () => {
    try {
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
        goalId: id,
        text: feedbackText,
        tags: selectedTags
      });
      
      setFeedbackText('');
      setSelectedTags({
        skills: [],
        values: [],
        initiatives: []
      });
      onClose();
      await fetchFeedback(); // Refresh feedback data
      
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
      setLoadingSuggestion(true);
      const res = await getSuggestion({ goalId: id });
      setFeedbackText(res.data.suggestion);
      setLoadingSuggestion(false);
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
  
  const handleAddComment = async () => {
    try {
      if (!commentText.trim()) {
        toast({
          title: 'Empty comment',
          description: 'Please enter some comment text',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      setLoadingComment(true);
      await addGoalComment(id, commentText);
      setCommentText('');
      commentModalDisclosure.onClose();
      await fetchGoal(); // Refresh goal data with new comment
      
      toast({
        title: 'Comment added',
        description: 'Your comment has been added successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setLoadingComment(false);
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to add comment',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setLoadingComment(false);
    }
  };
  
  const handleAddTag = async () => {
    try {
      if (!newTag.trim()) {
        toast({
          title: 'Empty tag',
          description: 'Please enter a tag',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      await addGoalTags(id, [newTag]);
      setNewTag('');
      tagModalDisclosure.onClose();
      await fetchGoal(); // Refresh goal data with new tags
      
      toast({
        title: 'Tag added',
        description: 'Tag has been added successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error adding tag:', error);
      toast({
        title: 'Error',
        description: 'Failed to add tag',
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
  
  if (loading) {
    return (
      <Layout>
        <Flex justify="center" align="center" height="50vh">
          <Spinner size="xl" color="blue.500" />
        </Flex>
      </Layout>
    );
  }
  
  if (error || !goal) {
    return (
      <Layout>
        <Box textAlign="center" my={10}>
          <Icon as={FiAlertTriangle} boxSize={10} color="red.500" mb={4} />
          <Heading size="md" mb={2}>Error Loading Goal</Heading>
          <Text>{error || 'Goal not found'}</Text>
          <Button 
            mt={4} 
            leftIcon={<FiArrowLeft />} 
            onClick={() => navigate('/goals')}
          >
            Back to Goals
          </Button>
        </Box>
      </Layout>
    );
  }
  
  const badgeColorScheme = 
    goal.level === 'company' ? 'purple' : 
    goal.level === 'department' ? 'blue' : 
    goal.level === 'team' ? 'green' : 'gray';
      const statusColorScheme = goal.status === 'Completed' ? 'green' : 'yellow';
    const isOwner = user && goal.owner && user.id === goal.owner._id;
  const isManager = user && user.role && (user.role === 'Manager' || user.role === 'Admin');
  const canUpdateGoal = isOwner || isManager;
  const canComment = isOwner || isManager;
  const canUpdateProgress = isOwner; // Only goal owner can update progress
  
  return (
    <Layout>
      <Box mb={8}>
        <Button 
          leftIcon={<FiArrowLeft />} 
          variant="ghost" 
          mb={4}
          onClick={() => navigate('/goals')}
        >
          Back to Goals
        </Button>
        
        <Card mb={6}>
          <CardBody>
            <HStack justify="space-between" mb={4} wrap="wrap">
              <Box>                <HStack mb={2}>
                  <Badge colorScheme={badgeColorScheme} fontSize="sm">
                    {goal.level}
                  </Badge>
                  <Badge colorScheme={statusColorScheme} fontSize="sm">
                    {goal.status}
                  </Badge>
                </HStack>
                <Heading size="lg" mb={2}>{goal.title}</Heading>
                  {/* Tags */}
                {goal.tags && goal.tags.length > 0 && (
                  <HStack spacing={2} mb={2} flexWrap="wrap">
                    {goal.tags.map(tag => (
                      <Badge key={tag} colorScheme="gray" variant="subtle">
                        {tag}
                      </Badge>
                    ))}                    {canUpdateProgress && (
                      <Button 
                        size="xs" 
                        leftIcon={<FiTag />} 
                        variant="ghost" 
                        onClick={tagModalDisclosure.onOpen}
                      >
                        Add Tag
                      </Button>
                    )}
                  </HStack>
                )}
                
                {/* Show add tag button if no tags */}                {(!goal.tags || goal.tags.length === 0) && canUpdateProgress && (
                  <Button 
                    size="xs" 
                    leftIcon={<FiTag />} 
                    colorScheme="blue" 
                    variant="outline" 
                    mb={2}
                    onClick={tagModalDisclosure.onOpen}
                  >
                    Add Tags
                  </Button>
                )}
                
                {goal.parentGoal && (
                  <Text fontSize="sm" color="gray.500" mb={2}>
                    Parent Goal: {goal.parentGoal.title}
                  </Text>
                )}
              </Box>
              
              <VStack align="flex-end" spacing={1}>
                <Text fontSize="sm">
                  Due: {format(new Date(goal.dueDate), 'MMM d, yyyy')}
                </Text>
                {goal.owner && (
                  <HStack>
                    <Text fontSize="sm">Owner: </Text>
                    <Avatar size="xs" name={goal.owner.name} />
                    <Text fontSize="sm">{goal.owner.name}</Text>
                  </HStack>
                )}
                {goal.completedAt && (
                  <Text fontSize="sm" color="green.500">
                    Completed: {format(new Date(goal.completedAt), 'MMM d, yyyy')}
                  </Text>
                )}
              </VStack>
            </HStack>
            
            <Text mb={6}>{goal.description}</Text>              <Box mb={6}>
                <HStack justify="space-between" mb={2}>
                  <Text fontWeight="medium">Progress: {goal.progress}%</Text>
                  {canUpdateProgress && (
                    <Button 
                      size="xs" 
                      leftIcon={<FiEdit />} 
                      onClick={handleProgressUpdate}
                      isDisabled={goal.status === 'Completed'}
                    >
                      Update
                    </Button>
                  )}
                </HStack>

                {canUpdateProgress ? (
                  <Slider
                    value={progress}
                    min={0}
                    max={100}
                    step={5}
                    onChange={(val) => setProgress(val)}
                    isDisabled={goal.status === 'Completed'}
                  >
                    <SliderTrack>
                      <SliderFilledTrack bg="blue.500" />
                    </SliderTrack>
                    <SliderThumb boxSize={6} />
                    <SliderMark
                      value={progress}
                      textAlign='center'
                      bg='blue.500'
                      color='white'
                      mt='-10'
                      ml='-5'
                      w='12'
                      fontSize="xs"
                      borderRadius="full"
                    >
                      {progress}%
                    </SliderMark>
                  </Slider>
                ) : (
                  <>
                    <Progress 
                      value={goal.progress} 
                      size="md" 
                      colorScheme="blue" 
                      borderRadius="md"
                    />
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      Only the goal owner can update the progress of this goal.
                    </Text>
                  </>
                )}
              </Box>
          </CardBody>
        </Card>
          <Tabs variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab>Feedback</Tab>
            <Tab>Comments</Tab>
            <Tab>Updates</Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel p={0} pt={4}>
              <HStack justify="space-between" mb={4}>
                <Heading size="md">Feedback</Heading>
                <Button 
                  colorScheme="blue" 
                  leftIcon={<FiMessageSquare />}
                  onClick={onOpen}
                >
                  Add Feedback
                </Button>
              </HStack>
              
              {loadingFeedback ? (
                <Flex justify="center" py={10}>
                  <Spinner />
                </Flex>
              ) : feedback.length > 0 ? (
                <VStack spacing={4} align="stretch">
                  {feedback.map(item => (
                    <Card key={item._id} variant="outline">
                      <CardBody>
                        <HStack justify="space-between" mb={2}>
                          <HStack>
                            <Avatar size="sm" name={item.author.name} />
                            <Box>
                              <Text fontWeight="medium">{item.author.name}</Text>
                              <Text fontSize="xs" color="gray.500">
                                {format(new Date(item.createdAt), 'MMM d, yyyy h:mm a')}
                              </Text>
                            </Box>
                          </HStack>
                          {item.sentiment && (
                            <Badge colorScheme={getSentimentColor(item.sentiment)}>
                              {item.sentiment.label}
                            </Badge>
                          )}                        </HStack>
                        <Text mb={2}>{item.text}</Text>
                        
                        {/* Tags display */}
                        {item.tags && (
                          <Box mb={2}>
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
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              ) : (
                <Box textAlign="center" py={10}>
                  <Text mb={4}>No feedback yet</Text>
                  <Button 
                    colorScheme="blue" 
                    leftIcon={<FiMessageSquare />}
                    onClick={onOpen}
                  >
                    Add the first feedback
                  </Button>
                </Box>
              )}
            </TabPanel>
              {/* Comments Tab */}
            <TabPanel p={0} pt={4}>              <HStack justify="space-between" mb={4}>
                <Heading size="md">Comments</Heading>
                {canComment && (
                  <Button 
                    colorScheme="blue" 
                    leftIcon={<FiMessageCircle />}
                    onClick={commentModalDisclosure.onOpen}
                  >
                    Add Comment
                  </Button>
                )}
              </HStack>
              
              {!canComment && (
                <Box mb={6} p={4} bg="gray.50" borderRadius="md">
                  <Text color="gray.600">
                    You don't have permission to comment on this goal. Only the goal owner or managers can add comments.
                  </Text>
                </Box>
              )}
              
              {goal.comments && goal.comments.length > 0 ? (
                <VStack spacing={4} align="stretch">
                  {goal.comments.map((comment, index) => (
                    <Card key={index} variant="outline">
                      <CardBody>
                        <HStack justify="space-between" mb={2}>
                          <HStack>
                            <Avatar size="sm" name={comment.author?.name || 'User'} />
                            <Box>
                              <Text fontWeight="medium">{comment.author?.name || 'User'}</Text>
                              <Text fontSize="xs" color="gray.500">
                                {comment.createdAt ? format(new Date(comment.createdAt), 'MMM d, yyyy h:mm a') : 'Recent'}
                              </Text>
                            </Box>
                          </HStack>
                        </HStack>
                        <Text>{comment.text}</Text>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>              ) : (                <Box textAlign="center" py={10}>
                  <Text mb={4}>No comments yet</Text>
                  {canComment && (
                    <Button 
                      colorScheme="blue" 
                      leftIcon={<FiMessageCircle />}
                      onClick={commentModalDisclosure.onOpen}
                    >
                      Add the first comment
                    </Button>
                  )}
                </Box>
              )}
            </TabPanel>
              {/* Updates Tab */}
            <TabPanel p={0} pt={4}>              <Heading size="md" mb={4}>Progress Updates</Heading>
              
              {canUpdateProgress ? (
                <FormControl mb={6}>
                  <FormLabel>Progress Note</FormLabel>
                  <Textarea 
                    value={progressNote} 
                    onChange={(e) => setProgressNote(e.target.value)} 
                    placeholder="Add a note about this progress update (optional)"
                    rows={2}
                    mb={2}
                  />
                  <Button 
                    colorScheme="blue" 
                    leftIcon={<FiRefreshCw />}
                    onClick={handleProgressUpdate}
                    isDisabled={goal.status === 'Completed'}
                  >
                    Update Progress with Note
                  </Button>
                </FormControl>
              ) : (
                <Box mb={6} p={4} bg="gray.50" borderRadius="md">
                  <Text color="gray.600">
                    You don't have permission to update this goal's progress. Only the goal owner can update progress.
                  </Text>
                </Box>
              )}
              
              {goal.updates && goal.updates.length > 0 ? (
                <VStack spacing={4} align="stretch">
                  {goal.updates.map((update, index) => (
                    <Card key={index} variant="outline">
                      <CardBody>
                        <HStack justify="space-between" mb={2}>
                          <Badge colorScheme="blue">{update.progress}%</Badge>
                          <Text fontSize="xs" color="gray.500">
                            {update.updatedAt ? format(new Date(update.updatedAt), 'MMM d, yyyy h:mm a') : 'Recent'}
                          </Text>
                        </HStack>
                        <Text>{update.note}</Text>
                        <Text fontSize="sm" color="gray.600" mt={1}>
                          By: {update.updatedBy?.name || 'User'}
                        </Text>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              ) : (
                <Box textAlign="center" py={10}>
                  <Icon as={FiClock} boxSize={10} color="gray.300" mb={3} />
                  <Text mb={4}>No progress updates recorded yet</Text>
                  <Text color="gray.500">
                    Progress updates will appear here when changes are made to the goal progress
                  </Text>
                </Box>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
      
      {/* Add Feedback Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Feedback</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={4} fontWeight="medium">Goal: {goal.title}</Text>
              <FormControl mb={4}>
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
      
      {/* Add Comment Modal */}
      <Modal isOpen={commentModalDisclosure.isOpen} onClose={commentModalDisclosure.onClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Comment</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={4} fontWeight="medium">Goal: {goal.title}</Text>
            <FormControl mb={4}>
              <FormLabel>Your Comment</FormLabel>
              <Textarea 
                value={commentText} 
                onChange={(e) => setCommentText(e.target.value)} 
                placeholder="Enter your comment on this goal"
                rows={4}
              />
            </FormControl>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={commentModalDisclosure.onClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleAddComment}
              isLoading={loadingComment}
            >
              Add Comment
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Add Tag Modal */}
      <Modal isOpen={tagModalDisclosure.isOpen} onClose={tagModalDisclosure.onClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Tag</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={4} fontWeight="medium">Goal: {goal.title}</Text>
            <FormControl mb={4}>
              <FormLabel>New Tag</FormLabel>
              <HStack>
                <Input 
                  value={newTag} 
                  onChange={(e) => setNewTag(e.target.value)} 
                  placeholder="Enter a tag (e.g. 'Q2', 'Marketing', 'High Priority')"
                />
                <Button 
                  colorScheme="blue" 
                  onClick={handleAddTag}
                >
                  Add
                </Button>
              </HStack>
            </FormControl>
            
            {goal.tags && goal.tags.length > 0 && (
              <Box mb={4}>
                <Text fontWeight="medium" mb={2}>Current Tags:</Text>
                <HStack spacing={2} flexWrap="wrap">
                  {goal.tags.map(tag => (
                    <Badge key={tag} colorScheme="gray">
                      {tag}
                    </Badge>
                  ))}
                </HStack>
              </Box>
            )}
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" onClick={tagModalDisclosure.onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Layout>
  );
};

export default GoalDetail;
