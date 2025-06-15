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
  Radio,
  RadioGroup,
  Stack,
  Badge,
  Checkbox,
  CheckboxGroup,
  Tag,
  TagLabel
} from '@chakra-ui/react';
import { FiPlus, FiTrash2, FiSave, FiEdit, FiEye } from 'react-icons/fi';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { createReviewTemplate, getReviewTemplates } from '../utils/api';

const ReviewTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    questions: [],
    isDefault: false,
    applicableRoles: ['All']
  });
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user } = useAuth();
  const toast = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await getReviewTemplates();
      setTemplates(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch review templates',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        {
          text: '',
          type: 'rating',
          category: 'general',
          options: [],
          ratingScale: { min: 1, max: 5, labels: {} },
          required: true,
          visibleTo: ['all']
        }
      ]
    });
  };

  const handleRemoveQuestion = (index) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions.splice(index, 1);
    setFormData({
      ...formData,
      questions: updatedQuestions
    });
  };

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[index][field] = value;
    setFormData({
      ...formData,
      questions: updatedQuestions
    });
  };

  const handleOptionAdd = (questionIndex) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[questionIndex].options.push({ label: '', value: '' });
    setFormData({
      ...formData,
      questions: updatedQuestions
    });
  };

  const handleOptionChange = (questionIndex, optionIndex, field, value) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[questionIndex].options[optionIndex][field] = value;
    setFormData({
      ...formData,
      questions: updatedQuestions
    });
  };

  const handleOptionRemove = (questionIndex, optionIndex) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[questionIndex].options.splice(optionIndex, 1);
    setFormData({
      ...formData,
      questions: updatedQuestions
    });
  };

  const handleVisibilityChange = (questionIndex, value) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[questionIndex].visibleTo = value;
    setFormData({
      ...formData,
      questions: updatedQuestions
    });
  };

  const handleSubmit = async () => {
    try {
      // Validate form
      if (!formData.name.trim()) {
        toast({
          title: 'Error',
          description: 'Template name is required',
          status: 'error',
          duration: 3000,
          isClosable: true
        });
        return;
      }

      if (formData.questions.length === 0) {
        toast({
          title: 'Error',
          description: 'At least one question is required',
          status: 'error',
          duration: 3000,
          isClosable: true
        });
        return;
      }

      for (const [index, question] of formData.questions.entries()) {
        if (!question.text.trim()) {
          toast({
            title: 'Error',
            description: `Question ${index + 1} text is required`,
            status: 'error',
            duration: 3000,
            isClosable: true
          });
          return;
        }

        if (question.type === 'multiple-choice' && question.options.length === 0) {
          toast({
            title: 'Error',
            description: `Question ${index + 1} needs at least one option`,
            status: 'error',
            duration: 3000,
            isClosable: true
          });
          return;
        }
      }

      await createReviewTemplate(formData);
      
      toast({
        title: 'Success',
        description: 'Review template created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      
      // Reset form and close modal
      setFormData({
        name: '',
        description: '',
        questions: [],
        isDefault: false,
        applicableRoles: ['All']
      });
      
      onClose();
      
      // Refresh templates
      fetchTemplates();
    } catch (error) {
      console.error('Error creating template:', error);
      toast({
        title: 'Error',
        description: 'Failed to create review template',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };

  const renderQuestionFields = (question, index) => {
    return (
      <Box 
        key={index} 
        p={4} 
        borderWidth="1px" 
        borderRadius="md" 
        mb={4}
        position="relative"
      >
        <IconButton
          icon={<FiTrash2 />}
          aria-label="Remove question"
          size="sm"
          colorScheme="red"
          variant="ghost"
          position="absolute"
          right="8px"
          top="8px"
          onClick={() => handleRemoveQuestion(index)}
        />
        
        <FormControl mb={3}>
          <FormLabel>Question Text</FormLabel>
          <Input
            value={question.text}
            onChange={(e) => handleQuestionChange(index, 'text', e.target.value)}
            placeholder="Enter question"
          />
        </FormControl>

        <HStack mb={3} spacing={4}>
          <FormControl>
            <FormLabel>Question Type</FormLabel>
            <Select
              value={question.type}
              onChange={(e) => handleQuestionChange(index, 'type', e.target.value)}
            >
              <option value="rating">Rating</option>
              <option value="open-ended">Open-ended</option>
              <option value="multiple-choice">Multiple Choice</option>
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel>Category</FormLabel>
            <Select
              value={question.category}
              onChange={(e) => handleQuestionChange(index, 'category', e.target.value)}
            >
              <option value="general">General</option>
              <option value="competency">Competency</option>
              <option value="goal">Goal</option>
            </Select>
          </FormControl>
        </HStack>

        {question.type === 'rating' && (
          <HStack mb={3} spacing={4}>
            <FormControl>
              <FormLabel>Min Rating</FormLabel>
              <Input
                type="number"
                value={question.ratingScale.min}
                onChange={(e) => {
                  const updatedQuestions = [...formData.questions];
                  updatedQuestions[index].ratingScale.min = parseInt(e.target.value);
                  setFormData({
                    ...formData,
                    questions: updatedQuestions
                  });
                }}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Max Rating</FormLabel>
              <Input
                type="number"
                value={question.ratingScale.max}
                onChange={(e) => {
                  const updatedQuestions = [...formData.questions];
                  updatedQuestions[index].ratingScale.max = parseInt(e.target.value);
                  setFormData({
                    ...formData,
                    questions: updatedQuestions
                  });
                }}
              />
            </FormControl>
          </HStack>
        )}

        {question.type === 'multiple-choice' && (
          <Box mb={3}>
            <FormLabel>Options</FormLabel>
            {question.options.map((option, optionIndex) => (
              <HStack key={optionIndex} mb={2}>
                <Input
                  value={option.label}
                  onChange={(e) => handleOptionChange(index, optionIndex, 'label', e.target.value)}
                  placeholder="Option label"
                />
                <Input
                  value={option.value}
                  onChange={(e) => handleOptionChange(index, optionIndex, 'value', e.target.value)}
                  placeholder="Option value"
                />
                <IconButton
                  icon={<FiTrash2 />}
                  aria-label="Remove option"
                  size="sm"
                  colorScheme="red"
                  onClick={() => handleOptionRemove(index, optionIndex)}
                />
              </HStack>
            ))}
            <Button
              leftIcon={<FiPlus />}
              size="sm"
              onClick={() => handleOptionAdd(index)}
              mt={2}
            >
              Add Option
            </Button>
          </Box>
        )}

        <FormControl mb={3}>
          <FormLabel>Visible To</FormLabel>
          <CheckboxGroup
            value={question.visibleTo}
            onChange={(value) => handleVisibilityChange(index, value)}
          >
            <Stack direction="row" spacing={4}>
              <Checkbox value="all">All</Checkbox>
              <Checkbox value="self">Self</Checkbox>
              <Checkbox value="peer">Peer</Checkbox>
              <Checkbox value="manager">Manager</Checkbox>
              <Checkbox value="upward">Upward</Checkbox>
            </Stack>
          </CheckboxGroup>
        </FormControl>

        <FormControl>
          <Checkbox
            isChecked={question.required}
            onChange={(e) => handleQuestionChange(index, 'required', e.target.checked)}
          >
            Required
          </Checkbox>
        </FormControl>
      </Box>
    );
  };

  return (
    <Layout>
      <Box mb={8}>
        <HStack justify="space-between" mb={6}>
          <Heading size="lg">Review Templates</Heading>
          {user.role && (user.role === 'Admin' || user.role === 'Manager') && (
            <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={onOpen}>
              Create Template
            </Button>
          )}
        </HStack>

        {loading ? (
          <Text>Loading templates...</Text>
        ) : templates.length > 0 ? (
          <VStack spacing={4} align="stretch">
            {templates.map(template => (
              <Card key={template._id} variant="outline">
                <CardHeader>
                  <HStack justify="space-between">
                    <Box>
                      <Heading size="md">{template.name}</Heading>
                      {template.isDefault && (
                        <Badge colorScheme="green" mt={1}>Default</Badge>
                      )}
                    </Box>
                    <HStack>
                      <IconButton
                        icon={<FiEye />}
                        aria-label="View template"
                        variant="ghost"
                      />
                      {user.role && user.role === 'Admin' && (
                        <IconButton
                          icon={<FiEdit />}
                          aria-label="Edit template"
                          variant="ghost"
                        />
                      )}
                    </HStack>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <Text mb={2}>{template.description}</Text>
                  <Text fontSize="sm" color="gray.600">
                    {template.questions.length} questions
                  </Text>
                  <HStack mt={2} wrap="wrap">
                    {template.applicableRoles.map(role => (
                      <Tag key={role} size="sm" colorScheme="blue" variant="subtle">
                        <TagLabel>{role}</TagLabel>
                      </Tag>
                    ))}
                  </HStack>
                </CardBody>
              </Card>
            ))}
          </VStack>
        ) : (
          <Box textAlign="center" py={10}>
            <Text mb={4}>No review templates yet</Text>
            {user.role && (user.role === 'Admin' || user.role === 'Manager') && (
              <Button
                leftIcon={<FiPlus />}
                colorScheme="blue"
                onClick={onOpen}
              >
                Create your first template
              </Button>
            )}
          </Box>
        )}
      </Box>

      {/* Create Template Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create Review Template</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={4}>
              <FormLabel>Template Name</FormLabel>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter template name"
              />
            </FormControl>

            <FormControl mb={4}>
              <FormLabel>Description</FormLabel>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter template description"
              />
            </FormControl>

            <FormControl mb={4}>
              <FormLabel>Applicable Roles</FormLabel>
              <CheckboxGroup
                value={formData.applicableRoles}
                onChange={(value) => setFormData({ ...formData, applicableRoles: value })}
              >
                <Stack direction="row" spacing={4}>
                  <Checkbox value="All">All</Checkbox>
                  <Checkbox value="Employee">Employee</Checkbox>
                  <Checkbox value="Manager">Manager</Checkbox>
                  <Checkbox value="Admin">Admin</Checkbox>
                </Stack>
              </CheckboxGroup>
            </FormControl>

            <FormControl mb={4}>
              <Checkbox
                isChecked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              >
                Set as Default Template
              </Checkbox>
            </FormControl>

            <Divider my={4} />

            <Heading size="md" mb={4}>Questions</Heading>
            
            {formData.questions.map((question, index) => renderQuestionFields(question, index))}

            <Button
              leftIcon={<FiPlus />}
              onClick={handleAddQuestion}
              mb={4}
              w="100%"
            >
              Add Question
            </Button>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              leftIcon={<FiSave />}
              colorScheme="blue"
              onClick={handleSubmit}
            >
              Save Template
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Layout>
  );
};

export default ReviewTemplates;
