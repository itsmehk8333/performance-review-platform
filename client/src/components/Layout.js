import React from 'react';
import { 
  Box, 
  Flex, 
  Heading, 
  Text, 
  IconButton, 
  Avatar, 
  Menu, 
  MenuButton, 
  MenuList, 
  MenuItem,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  VStack,
  HStack,
  Icon,
  useColorModeValue,
  Container,
  Collapse,
  Button,
  Badge
} from '@chakra-ui/react';
import { 
  HamburgerIcon, 
  ChevronDownIcon,
  ChevronRightIcon
} from '@chakra-ui/icons';
import { 
  FiHome, 
  FiTarget, 
  FiMessageSquare, 
  FiClipboard, 
  FiDownload,
  FiUser,
  FiBarChart2,
  FiList,
  FiCalendar,
  FiUsers
} from 'react-icons/fi';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NavItem = ({ icon, to, children, active, onClick }) => {
  const activeBg = useColorModeValue('brand.50', 'brand.900');
  const activeColor = useColorModeValue('brand.700', 'brand.200');
  
  return (
    <Flex
      align="center"
      px="4"
      py="3"
      cursor="pointer"
      role="group"
      fontWeight={active ? "bold" : "normal"}
      bg={active ? activeBg : "transparent"}
      color={active ? activeColor : "inherit"}
      borderRadius="md"
      _hover={{
        bg: activeBg,
        color: activeColor,
      }}
      as={to ? RouterLink : 'div'}
      to={to}
      w="100%"
      onClick={onClick}
    >
      {icon && (
        <Icon
          mr="3"
          fontSize="16"
          as={icon}
        />
      )}
      {children}
    </Flex>
  );
};

const NavGroup = ({ icon, title, children, active, isOpen, onToggle }) => {
  const activeBg = useColorModeValue('brand.50', 'brand.900');
  const activeColor = useColorModeValue('brand.700', 'brand.200');
  
  return (
    <Box>
      <Flex
        align="center"
        px="4"
        py="3"
        cursor="pointer"
        role="group"
        fontWeight={active ? "bold" : "normal"}
        bg={active ? activeBg : "transparent"}
        color={active ? activeColor : "inherit"}
        borderRadius="md"
        _hover={{
          bg: activeBg,
          color: activeColor,
        }}
        onClick={onToggle}
        justify="space-between"
      >
        <HStack>
          {icon && (
            <Icon
              mr="3"
              fontSize="16"
              as={icon}
            />
          )}
          <Text>{title}</Text>
        </HStack>
        <Icon
          as={isOpen ? ChevronDownIcon : ChevronRightIcon}
          transition="all .25s ease-in-out"
        />
      </Flex>
      <Collapse in={isOpen} animateOpacity>
        <Box pl={6} pt={2} pb={2}>
          {children}
        </Box>
      </Collapse>
    </Box>
  );
};

const Layout = ({ children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user, logout, isAdmin, isManager } = useAuth();
  const location = useLocation();
  
  return (
    <Box minH="100vh">
      {/* Header */}
      <Flex
        as="header"
        align="center"
        justify="space-between"
        w="100%"
        px={4}
        bg={useColorModeValue('white', 'gray.800')}
        borderBottomWidth="1px"
        borderBottomColor={useColorModeValue('gray.200', 'gray.700')}
        h="16"
        position="fixed"
        top="0"
        zIndex="1"
      >
        <Flex align="center">
          <IconButton
            aria-label="Open menu"
            icon={<HamburgerIcon />}
            size="md"
            variant="ghost"
            onClick={onOpen}
            display={{ base: 'flex', md: 'none' }}
          />
          <Heading 
            as={RouterLink} 
            to="/dashboard" 
            size="lg" 
            ml={{ base: 2, md: 0 }}
            color="brand.500"
          >
            PRP
          </Heading>
        </Flex>

        <Flex align="center">          <Menu>
            <MenuButton
              as={Box}
              cursor="pointer"
            >              <HStack>
                <Avatar size="sm" name={user?.name} />
                <Text display={{ base: 'none', md: 'flex' }}>{user?.name}</Text>
                {user?.role && (
                  <Badge colorScheme="purple" ml={2}>{typeof user.role === 'object' ? user.role.name : user.role}</Badge>
                )}
                <ChevronDownIcon />
              </HStack>
            </MenuButton>
            <MenuList>
              <MenuItem as={RouterLink} to="/profile">
                <Icon as={FiUser} mr={2} />
                Profile
              </MenuItem>              <MenuItem onClick={() => alert(`User Role: ${typeof user?.role === 'object' ? user?.role?.name : user?.role}\nIsAdmin: ${isAdmin()}\nIsManager: ${isManager()}`)}>
                Show Role Info
              </MenuItem>
              <MenuItem onClick={logout}>Logout</MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Flex>

      {/* Sidebar - Desktop */}
      <Box
        as="nav"
        pos="fixed"
        top="16"
        left="0"
        h="calc(100vh - 4rem)"
        w="60"
        bg={useColorModeValue('white', 'gray.800')}
        borderRightWidth="1px"
        borderRightColor={useColorModeValue('gray.200', 'gray.700')}
        display={{ base: 'none', md: 'block' }}
      >
        <VStack spacing={1} align="stretch" p={4}>
          <NavItem 
            icon={FiHome} 
            to="/dashboard" 
            active={location.pathname === '/dashboard'}
          >
            Dashboard
          </NavItem>
          <NavItem 
            icon={FiTarget} 
            to="/goals" 
            active={location.pathname.startsWith('/goals')}
          >
            Goals
          </NavItem>
          <NavItem 
            icon={FiMessageSquare} 
            to="/feedback" 
            active={location.pathname.startsWith('/feedback')}
          >
            Feedback
          </NavItem>          <Box>
            <NavItem 
              icon={FiClipboard} 
              to="/reviews" 
              active={location.pathname === '/reviews'}
            >
              Reviews
            </NavItem>
            <NavItem 
              icon={FiBarChart2} 
              to="/reviews/dashboard" 
              active={location.pathname === '/reviews/dashboard'}
            >
              <Text pl={6}>Review Dashboard</Text>
            </NavItem>
            {(isAdmin() || isManager()) && (
              <>
                <NavItem 
                  icon={FiList} 
                  to="/reviews/templates" 
                  active={location.pathname === '/reviews/templates'}
                >
                  <Text pl={6}>Review Templates</Text>
                </NavItem>
                <NavItem 
                  icon={FiCalendar} 
                  to="/reviews/cycles" 
                  active={location.pathname === '/reviews/cycles'}
                >
                  <Text pl={6}>Review Cycles</Text>
                </NavItem>
              </>
            )}
          </Box>          {(isAdmin() || isManager()) && (
            <NavItem 
              icon={FiDownload} 
              to="/exports" 
              active={location.pathname === '/exports'}
            >
              Exports
            </NavItem>          )}
          {isAdmin() && (
            <NavItem 
              icon={FiUsers} 
              to="/org-chart" 
              active={location.pathname === '/org-chart'}
            >
              Org Chart
            </NavItem>
          )}
        </VStack>
      </Box>

      {/* Mobile drawer */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="xs">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
            Performance Review Platform
          </DrawerHeader>
          <DrawerBody p={0}>
            <VStack spacing={0} align="stretch">
              <NavItem 
                icon={FiHome} 
                to="/dashboard" 
                active={location.pathname === '/dashboard'}
                onClick={onClose}
              >
                Dashboard
              </NavItem>
              <NavItem 
                icon={FiTarget} 
                to="/goals" 
                active={location.pathname.startsWith('/goals')}
                onClick={onClose}
              >
                Goals
              </NavItem>
              <NavItem 
                icon={FiMessageSquare} 
                to="/feedback" 
                active={location.pathname.startsWith('/feedback')}
                onClick={onClose}
              >
                Feedback
              </NavItem>              <Box>
                <NavItem 
                  icon={FiClipboard} 
                  to="/reviews" 
                  active={location.pathname === '/reviews'}
                  onClick={onClose}
                >
                  Reviews
                </NavItem>
                <NavItem 
                  icon={FiBarChart2} 
                  to="/reviews/dashboard" 
                  active={location.pathname === '/reviews/dashboard'}
                  onClick={onClose}
                >
                  <Text pl={6}>Review Dashboard</Text>
                </NavItem>
                {(isAdmin() || isManager()) && (
                  <>
                    <NavItem 
                      icon={FiList} 
                      to="/reviews/templates" 
                      active={location.pathname === '/reviews/templates'}
                      onClick={onClose}
                    >
                      <Text pl={6}>Review Templates</Text>
                    </NavItem>
                    <NavItem 
                      icon={FiCalendar} 
                      to="/reviews/cycles" 
                      active={location.pathname === '/reviews/cycles'}
                      onClick={onClose}
                    >
                      <Text pl={6}>Review Cycles</Text>
                    </NavItem>
                  </>
                )}
              </Box>              {(isAdmin() || isManager()) && (
                <NavItem 
                  icon={FiDownload} 
                  to="/exports" 
                  active={location.pathname === '/exports'}
                  onClick={onClose}
                >
                  Exports
                </NavItem>
              )}              {isAdmin() && (
                <NavItem 
                  icon={FiUsers} 
                  to="/org-chart" 
                  active={location.pathname === '/org-chart'}
                  onClick={onClose}
                >
                  Org Chart
                </NavItem>
              )}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Main content */}
      <Box ml={{ base: 0, md: 60 }} p={4} pt="20">
        <Container maxW="container.xl">
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;
