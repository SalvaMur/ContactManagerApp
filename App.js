import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Button, StyleSheet, Text, TouchableOpacity, ScrollView, View, TextInput } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Constants from 'expo-constants';
import * as SQLite from 'expo-sqlite';

// Initialize database connection
const db = openDatabase();
function openDatabase() {
	if (Platform.OS === 'web') {
		return {
			transaction: () => {return {executeSql: () => {}};}
		};
	}

	return SQLite.openDatabase('db.db');
}

function ContactListScreen({navigation, route}) {
	const [contacts, setContacts] = useState([]);

	// Handle new contacts
	useEffect(() => {
		if (route.params !== undefined) {

			// Assing unique ID to contact
			do {
				route.params.id = Math.floor(Math.random() * 1000);
			} while (contacts.some((contact) => contact.id == route.params.id));

			addToDB(route.params);
			setContacts([route.params, ...contacts])
		}
	}, [route.params]);

	// Create contacts if not present in DB and get contacts from DB once mounted
	useEffect(() => {
		db.transaction((tx) => {
			tx.executeSql(
				'CREATE TABLE if not exists contacts (	\
					id INTEGER PRIMARY KEY not null,	\
					name TEXT, phone TEXT, email TEXT,	\
					address TEXT, relation TEXT			\
				);'
			);

			tx.executeSql(
				'SELECT * FROM contacts;', [], 
				(_, {rows}) => console.log(JSON.stringify(rows))
			);

			tx.executeSql(
				'SELECT * FROM contacts;', [],
				(_, {rows: {_array}}) => setContacts(_array)
			);
		});
	}, []);

	// Add contact to DB
	function addToDB({id, name, phone, email, address, relation}) {
		db.transaction((tx) => {

			// Table 'contacts' must exist if adding to it
			tx.executeSql(
				'CREATE TABLE if not exists contacts (	\
					id INTEGER PRIMARY KEY not null,	\
					name TEXT, phone TEXT, email TEXT,	\
					address TEXT, relation TEXT			\
				);'
			);

			tx.executeSql(
				'INSERT INTO contacts (id, name, phone, email, address, relation) \
				VALUES (?, ?, ?, ?, ?, ?);', 
				[id, name, phone, email, address, relation]
			);

			tx.executeSql(
				'select * from contacts;', [], 
				(_, {rows}) => console.log(JSON.stringify(rows))
			);
		});
	}

	// Delete contact from contacts and DB
	function delContact(key) {
		db.transaction((tx) => {
			tx.executeSql(
				'DELETE FROM contacts WHERE id = ?;',
				[contacts[key].id]
			);

			tx.executeSql(
				'SELECT * FROM contacts;', [],
				(_, {rows: {_array}}) => setContacts(_array)
			);
		});
	}

	// Drop contacts table from DB (NOTE: Used for debugging)
	function cleanDB() {
		db.transaction((tx) => {
			tx.executeSql(
				'DROP TABLE contacts;'
			);

			setContacts([]);
		});
	}

	// Contact list item subcomponent
	function Contact(key, item) {
		return (
			<View key={key} style={styles.contactListItem}>
				
				<TouchableOpacity style={styles.itemHeader} onPress={() => navigation.navigate('Contact Info', item)}>
					<Text style={styles.niceFont}>{item.name}</Text>
					<Text style={styles.niceFont}>ID: {item.id}</Text>
				</TouchableOpacity>
	
				<TouchableOpacity style={styles.delButton} onPress={() => delContact(key)} >
					<Text style={[styles.niceFont, {color: '#fff'}]}>&#x2573;</Text>
				</TouchableOpacity>
	
			</View>
		);
	}

	return (
		<View style={styles.container}>

			<View style={styles.dualButton}>

				<TouchableOpacity style={[styles.frameButton, {backgroundColor: '#ff2617'}]} onPress={cleanDB}>
					<Text style={styles.buttonFont}>CLEAN DB</Text>
				</TouchableOpacity>

				<TouchableOpacity style={[styles.frameButton, {backgroundColor: '#4fd3ff'}]} 
					onPress={() => navigation.navigate('Create Contact')}
				>
					<Text style={styles.buttonFont}>ADD NEW CONTACT</Text>
				</TouchableOpacity>

			</View>

			<View style={styles.contactsContainer}>

				<Text style={styles.header}>Contacts</Text>

				<ScrollView>
					{
						(contacts.length == 0) ? <Text style={styles.specialFont}>No Contacts</Text> : 
						Object.keys(contacts).map((key) => Contact(key, contacts[key]))
					}
				</ScrollView>

			</View>

			<StatusBar style='auto' />

		</View>
	);
}

function AddContactScreen({navigation}) {
	const [name, onChangeName] = useState(null);
	const [phone, onChangePhone] = useState(null);
	const [email, onChangeEmail] = useState(null);
	const [address, onChangeAddress] = useState(null);
	const [relation, onChangeRelation] = useState(null);

	function addNewContact() {
		let contact = {
			name: name, phone: phone, email: email, 
			address: address, relation: relation
		};
		navigation.navigate('Contacts', contact);
	}

	return (
		<View style={styles.container}>

			<Text style={styles.header}>Enter New Contact Info</Text>

			<View style={styles.inputContainer}>
				<TextInput onChangeText={onChangeName} style={styles.inputField}
					value={name} placeholder='Enter Name' 
				/>
				<TextInput onChangeText={onChangePhone} style={styles.inputField}
					value={phone} placeholder='Enter Phone Number' 
				/>
				<TextInput onChangeText={onChangeEmail} style={styles.inputField}
					value={email} placeholder='Enter Email' 
				/>
				<TextInput onChangeText={onChangeAddress} style={styles.inputField}
					value={address} placeholder='Enter Address' 
				/>
				<TextInput onChangeText={onChangeRelation} style={styles.inputField}
					value={relation} placeholder='Enter Relationship' 
				/>
			</View>

			<View style={styles.dualButton}>

				<TouchableOpacity style={[styles.frameButton, {backgroundColor: '#4fd3ff'}]} 
					onPress={() => navigation.navigate('Contacts')}
				>
					<Text style={styles.buttonFont}>CANCEL</Text>
				</TouchableOpacity>

				<TouchableOpacity style={[styles.frameButton, {backgroundColor: '#4fd3ff'}]}
					onPress={addNewContact}
				>
					<Text style={styles.buttonFont}>ENTER</Text>
				</TouchableOpacity>

			</View>

			<StatusBar style="auto" />

		</View>
	);
}

function ContactInfoScreen({navigation, route}) {
	const {name, phone, email, address, relation} = route.params;

	return (
		<View style={styles.container}>

			<View style={styles.infoContainer}>
				<Text style={styles.info}>Name: {name}</Text>
				<Text style={styles.info}>Phone: {phone}</Text>
				<Text style={styles.info}>Email: {email}</Text>
				<Text style={styles.info}>Address: {address}</Text>
				<Text style={styles.info}>Relationship: {relation}</Text>
			</View>
			
			<TouchableOpacity style={styles.returnButton} onPress={() => navigation.navigate('Contacts')}>
				<Text style={styles.buttonFont}>RETURN</Text>
			</TouchableOpacity>

		</View>
	);
}

const Stack = createStackNavigator();
export default function App() {
	return (
		<NavigationContainer>
			<Stack.Navigator initialRouteName='Contacts'>
				<Stack.Screen name='Contacts' component={ContactListScreen} />
				<Stack.Screen name='Create Contact' component={AddContactScreen} />
				<Stack.Screen name='Contact Info' component={ContactInfoScreen} />
			</Stack.Navigator>
		</NavigationContainer>
	);
}

const styles = StyleSheet.create({
	niceFont: {
		fontSize: 24
	},
	bigFont: {
		fontSize: 32
	},
	buttonFont: {
		fontSize: 24,
		textAlign: 'center',
		color: '#fff'
	},
	specialFont: {
		textAlign: 'center',
		fontSize: 32,
		color: '#828282',
		alignSelf: 'center',
		marginVertical: '50%'
	},
	header: {
		textAlign: 'center',
		fontSize: 32,
		marginVertical: 10,
		textDecorationLine: 'underline'
	},
	container: {
		flex: 1,
		backgroundColor: '#fff',
		alignItems: 'center',
		justifyContent: 'center',
	},
	dualButton: {
		flex: 1,
		flexDirection: 'row',
		marginVertical: 10,
		width: '100%'
	},
	frameButton: {
		flex: 1,
		alignItems: 'center',
		marginHorizontal: 15,
		justifyContent: 'center'
	},
	contactsContainer: {
		flex: 9,
		width: '100%'
	},
	contactListItem: {
		alignSelf: 'center',
		width: '90%',
		backgroundColor: '#e6eded',
		flexDirection: 'row',
		marginVertical: 5
	},
	itemHeader: {
		flex: 4,
		marginVertical: 10,
		paddingLeft: 10
	},
	delButton: {
		flex: 1,
		backgroundColor: '#ff2617',
		alignItems: 'center',
		justifyContent: 'center'
	},
	inputContainer: {
		flex: 9,
		width: '80%'
	},
	inputField: {
		flex: 1,
		backgroundColor: '#e6eded',
		fontSize: 24,
		borderBottomWidth: 3,
		borderBottomColor: '#59fff1',
		paddingHorizontal: 10,
		marginVertical: 5
	},
	infoContainer: {
		flex: 9,
		alignItems: 'flex-start',
		justifyContent: 'center',
		width: '90%'
	},
	info: {
		fontSize: 32,
		marginVertical: 10
	},
	returnButton: {
		flex: 1,
		backgroundColor: '#4fd3ff',
		alignItems: 'center',
		marginVertical: 15,
		width: '70%',
		justifyContent: 'center'
	}
});
