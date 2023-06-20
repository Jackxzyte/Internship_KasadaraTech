import { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup
 } from 'firebase/auth'
import { onSnapshot , collection , setDoc , doc , getDoc } from 'firebase/firestore';
import { auth , db } from '../firebase';

const userAuthContext = createContext();

export function UseAuthContextProvider( { children } ){

    const navigate = useNavigate();
    const [ user , setUser ] = useState({});
    const [ currentUsername , setCurrentUsername ] = useState('');
    const [ allUsers , setAllUsers ] = useState([]);

    useEffect(() => {
        const s = onAuthStateChanged(auth, (cur) => {
            console.log('changed',cur);
            setUser(cur);
            cur ? navigate('/home') : navigate('/')  

            //username
            if(cur){
                onSnapshot(collection(db , 'Users'), (snapshot) => {
                    snapshot.docs.map(usr => {
                        if(usr.id === cur.uid){
                            console.log('usr',usr.data().Username,usr.id);
                            setCurrentUsername(usr.data().Username);
                        }
                    })
                }, (error) => {
                    console.log('USERS fetch error:', error);
                });
            }
        });
      
        return () => s();
    }, []);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db , 'Users'), (snapshot) => {
            const users = snapshot.docs.map((doc) => ({ ...doc.data()}));
            setAllUsers(users);
            console.log("All USERS "+(users.length), users);
        }, (error) => {
            console.log('USERS fetch error:', error);
        });
      
        return () => unsubscribe();
    }, []);
    
    const provider = new GoogleAuthProvider();
    function signInWithGoogle() {
    signInWithPopup(auth, provider).then((res) => {
        if(res.user.reloadUserInfo.lastLoginAt - res.user.reloadUserInfo.createdAt < 10){
            //change username
            const userInfo = {Username : 'new_user_'+res.user.uid};
            setDoc(doc(db , 'Users' , res.user.uid), userInfo).then((resp)=>{
                console.log('Success : upload user info to Users',resp);
            }).catch((error)=>{
                console.log('Failure : didnt upload to db',error);
            })
        }
        localStorage.setItem('profile' , res.user.photoURL);
        return true;
    }).catch((error) => {
        console.log(error);
        return false;
    });
    };

    function logIn(email, password){
        return signInWithEmailAndPassword(auth, email, password);
    }

    function signUp(email, password){
        return createUserWithEmailAndPassword(auth, email, password);
    }

    function logOut(){
        return signOut(auth);
    }
    
    function isUsernameExists(username){
        var exists = false;
        allUsers.map(user => {
            if(user.Username === username) {
                exists = true;
                console.log("EXISTSSSSS");    
            }
            }
        )
        return exists;
    }

    return <userAuthContext.Provider value={{logIn, signUp, logOut, signInWithGoogle, isUsernameExists, user, allUsers, currentUsername}}>{children}</userAuthContext.Provider>
}

export function useUserAuth(){
    return useContext(userAuthContext);
}